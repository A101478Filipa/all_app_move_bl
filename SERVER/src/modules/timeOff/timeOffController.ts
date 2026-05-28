import {
  CreateTimeOffRequest, UpdateTimeOffRequest, RespondTimeOffRequest,
  UpsertVacationPolicyRequest, UserRole, TimeOffStatus,
} from 'moveplus-shared';
import { sendSuccess, sendError, sendInputValidationError, sendEmptySuccess } from '../../utils/apiResponse';
import prisma from '../../prisma';
import { sendTimeOffRequestNotifications } from '../../utils/notificationHelpers';

const userSummarySelect = {
  id: true,
  role: true,
  caregiver: { select: { name: true } },
  institutionAdmin: { select: { name: true } },
  clinician: { select: { name: true } },
  programmer: { select: { name: true } },
  elderly: { select: { name: true } },
};

const formatUser = (u: any) => ({
  id: u.id,
  name:
    u.caregiver?.name ||
    u.institutionAdmin?.name ||
    u.clinician?.name ||
    u.programmer?.name ||
    u.elderly?.name ||
    'Unknown',
  role: u.role,
});

// GET /time-off/:userId
export const getTimeOffs = async (req, res) => {
  const { userId: requesterId, role } = req.user;
  const targetUserId = Number(req.params.userId);

  if (
    role !== UserRole.INSTITUTION_ADMIN &&
    role !== UserRole.PROGRAMMER &&
    requesterId !== targetUserId
  ) {
    return sendError(res, 'Forbidden', 403);
  }

  try {
    const timeOffs = await prisma.staffTimeOff.findMany({
      where: { userId: targetUserId },
      orderBy: { startDate: 'asc' },
      include: {
        user: { select: userSummarySelect },
        createdBy: { select: userSummarySelect },
        respondedBy: { select: userSummarySelect },
      },
    });

    return sendSuccess(res, timeOffs.map(t => ({
      ...t,
      user: formatUser(t.user),
      createdBy: formatUser(t.createdBy),
      respondedBy: t.respondedBy ? formatUser(t.respondedBy) : null,
    })));
  } catch (error) {
    console.error('Error fetching time-offs:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// POST /time-off — any staff member can request; admin creates as APPROVED
export const createTimeOff = async (req, res) => {
  const { userId: requesterId, role } = req.user;

  const validation = CreateTimeOffRequest.safeParse(req.body);
  if (!validation.success) {
    return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
  }

  const { userId, type, startDate, endDate, note } = validation.data;

  // Caregivers and clinicians can only create for themselves
  if (
    (role === UserRole.CAREGIVER || role === UserRole.CLINICIAN) &&
    userId !== requesterId
  ) {
    return sendError(res, 'You can only create time-off requests for yourself', 403);
  }

  if (endDate < startDate) {
    return sendError(res, 'endDate must be after or equal to startDate', 400);
  }

  // Admins / programmers create as APPROVED directly; others submit as PENDING
  const isAdmin = role === UserRole.INSTITUTION_ADMIN || role === UserRole.PROGRAMMER;
  const status = isAdmin ? TimeOffStatus.APPROVED : TimeOffStatus.PENDING;

  try {
    const timeOff = await prisma.staffTimeOff.create({
      data: {
        userId,
        createdById: requesterId,
        type,
        status,
        startDate,
        endDate,
        note: note ?? null,
        ...(isAdmin && {
          respondedById: requesterId,
          respondedAt: new Date(),
        }),
      },
      include: {
        user: { select: userSummarySelect },
        createdBy: { select: userSummarySelect },
        respondedBy: { select: userSummarySelect },
      },
    });

    const responsePayload = {
      ...timeOff,
      user: formatUser(timeOff.user),
      createdBy: formatUser(timeOff.createdBy),
      respondedBy: timeOff.respondedBy ? formatUser(timeOff.respondedBy) : null,
    };

    // Fire-and-forget: notify admins if it's a staff-submitted PENDING request
    if (status === TimeOffStatus.PENDING) {
      const requesterDisplay = formatUser(timeOff.createdBy).name;
      sendTimeOffRequestNotifications(
        requesterId,
        timeOff.id,
        requesterDisplay,
        String(type),
        new Date(startDate),
        new Date(endDate),
      ).catch(err => console.error('Time-off notification failed:', err));
    }

    return sendSuccess(res, responsePayload, 'Time-off created', 201);
  } catch (error) {
    console.error('Error creating time-off:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// PUT /time-off/:id/respond — admin approves or denies a request
export const respondTimeOff = async (req, res) => {
  const { userId: requesterId, role } = req.user;
  const id = Number(req.params.id);

  if (role !== UserRole.INSTITUTION_ADMIN && role !== UserRole.PROGRAMMER) {
    return sendError(res, 'Forbidden', 403);
  }

  const existing = await prisma.staffTimeOff.findUnique({ where: { id } });
  if (!existing) return sendError(res, 'Time-off not found', 404);

  const validation = RespondTimeOffRequest.safeParse(req.body);
  if (!validation.success) {
    return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
  }

  try {
    const timeOff = await prisma.staffTimeOff.update({
      where: { id },
      data: {
        status: validation.data.status,
        responseNote: validation.data.responseNote ?? null,
        respondedById: requesterId,
        respondedAt: new Date(),
      },
      include: {
        user: { select: userSummarySelect },
        createdBy: { select: userSummarySelect },
        respondedBy: { select: userSummarySelect },
      },
    });

    return sendSuccess(res, {
      ...timeOff,
      user: formatUser(timeOff.user),
      createdBy: formatUser(timeOff.createdBy),
      respondedBy: timeOff.respondedBy ? formatUser(timeOff.respondedBy) : null,
    }, 'Time-off updated');
  } catch (error) {
    console.error('Error responding to time-off:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// PUT /time-off/:id — admin: any; staff: own PENDING only
export const updateTimeOff = async (req, res) => {
  const { userId: requesterId, role } = req.user;
  const id = Number(req.params.id);

  const existing = await prisma.staffTimeOff.findUnique({ where: { id } });
  if (!existing) return sendError(res, 'Time-off not found', 404);

  const isAdmin = role === UserRole.INSTITUTION_ADMIN || role === UserRole.PROGRAMMER;

  if (!isAdmin) {
    if (existing.userId !== requesterId) return sendError(res, 'Forbidden', 403);
    if ((existing.status as any) !== TimeOffStatus.PENDING) {
      return sendError(res, 'Only pending requests can be edited', 400);
    }
  }

  const validation = UpdateTimeOffRequest.safeParse(req.body);
  if (!validation.success) {
    return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
  }

  try {
    const timeOff = await prisma.staffTimeOff.update({
      where: { id },
      data: {
        ...(validation.data.type !== undefined && { type: validation.data.type }),
        ...(validation.data.startDate !== undefined && { startDate: validation.data.startDate }),
        ...(validation.data.endDate !== undefined && { endDate: validation.data.endDate }),
        ...('note' in validation.data && { note: validation.data.note ?? null }),
      },
      include: {
        user: { select: userSummarySelect },
        createdBy: { select: userSummarySelect },
        respondedBy: { select: userSummarySelect },
      },
    });

    return sendSuccess(res, {
      ...timeOff,
      user: formatUser(timeOff.user),
      createdBy: formatUser(timeOff.createdBy),
      respondedBy: timeOff.respondedBy ? formatUser(timeOff.respondedBy) : null,
    }, 'Time-off updated');
  } catch (error) {
    console.error('Error updating time-off:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// DELETE /time-off/:id — admin: any; staff: own PENDING only
export const deleteTimeOff = async (req, res) => {
  const { userId: requesterId, role } = req.user;
  const id = Number(req.params.id);

  const existing = await prisma.staffTimeOff.findUnique({ where: { id } });
  if (!existing) return sendError(res, 'Time-off not found', 404);

  const isAdmin = role === UserRole.INSTITUTION_ADMIN || role === UserRole.PROGRAMMER;

  if (!isAdmin) {
    if (existing.userId !== requesterId) return sendError(res, 'Forbidden', 403);
    if ((existing.status as any) !== TimeOffStatus.PENDING) {
      return sendError(res, 'Only pending requests can be deleted', 400);
    }
  }

  try {
    await prisma.staffTimeOff.delete({ where: { id } });
    return sendEmptySuccess(res, 'Time-off deleted');
  } catch (error) {
    console.error('Error deleting time-off:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// GET /time-off/institution — all staff time-offs for the admin's institution
export const getInstitutionTimeOffs = async (req, res) => {
  const { userId, role } = req.user;

  try {
    let institutionId: number | null = null;
    if (role === UserRole.INSTITUTION_ADMIN || role === UserRole.PROGRAMMER) {
      const admin = await prisma.institutionAdmin.findUnique({ where: { userId }, select: { institutionId: true } });
      if (!admin) return sendError(res, 'Admin not found', 404);
      institutionId = admin.institutionId;
    } else if (role === UserRole.CAREGIVER) {
      const caregiver = await prisma.caregiver.findUnique({ where: { userId }, select: { institutionId: true } });
      if (!caregiver) return sendError(res, 'Caregiver not found', 404);
      institutionId = caregiver.institutionId;
    } else if (role === UserRole.CLINICIAN) {
      const clinician = await prisma.clinician.findUnique({ where: { userId }, select: { institutionId: true } });
      if (!clinician) return sendError(res, 'Clinician not found', 404);
      institutionId = clinician.institutionId;
    } else {
      return sendError(res, 'Forbidden', 403);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const admin = { institutionId: institutionId! };

    const [caregivers, clinicians, admins] = await Promise.all([
      prisma.caregiver.findMany({ where: { institutionId: admin.institutionId }, select: { userId: true } }),
      prisma.clinician.findMany({ where: { institutionId: admin.institutionId }, select: { userId: true } }),
      prisma.institutionAdmin.findMany({ where: { institutionId: admin.institutionId }, select: { userId: true } }),
    ]);

    const staffUserIds = [
      ...caregivers.map(c => c.userId),
      ...clinicians.map(c => c.userId),
      ...admins.map(a => a.userId),
    ];

    const timeOffs = await prisma.staffTimeOff.findMany({
      where: { userId: { in: staffUserIds } },
      orderBy: [{ status: 'asc' }, { startDate: 'asc' }],
      include: {
        user: { select: userSummarySelect },
        createdBy: { select: userSummarySelect },
        respondedBy: { select: userSummarySelect },
      },
    });

    return sendSuccess(res, timeOffs.map(t => ({
      ...t,
      user: formatUser(t.user),
      createdBy: formatUser(t.createdBy),
      respondedBy: t.respondedBy ? formatUser(t.respondedBy) : null,
    })));
  } catch (error) {
    console.error('Error fetching institution time-offs:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// GET /time-off/policy — get the institution vacation policy
export const getVacationPolicy = async (req, res) => {
  const { userId, role } = req.user;

  try {
    let institutionId: number | null = null;

    if (role === UserRole.INSTITUTION_ADMIN || role === UserRole.PROGRAMMER) {
      const admin = await prisma.institutionAdmin.findUnique({
        where: { userId },
        select: { institutionId: true },
      });
      institutionId = admin?.institutionId ?? null;
    } else if (role === UserRole.CAREGIVER) {
      const caregiver = await prisma.caregiver.findUnique({
        where: { userId },
        select: { institutionId: true },
      });
      institutionId = caregiver?.institutionId ?? null;
    } else if (role === UserRole.CLINICIAN) {
      const clinician = await prisma.clinician.findUnique({
        where: { userId },
        select: { institutionId: true },
      });
      institutionId = clinician?.institutionId ?? null;
    } else {
      return sendError(res, 'Forbidden', 403);
    }

    if (institutionId == null) return sendError(res, 'Staff profile not found', 404);

    const policy = await prisma.institutionVacationPolicy.findUnique({
      where: { institutionId },
    });

    return sendSuccess(res, policy);
  } catch (error) {
    console.error('Error fetching vacation policy:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// PUT /time-off/policy — create or update the institution vacation policy
export const upsertVacationPolicy = async (req, res) => {
  const { userId, role } = req.user;

  if (role !== UserRole.INSTITUTION_ADMIN && role !== UserRole.PROGRAMMER) {
    return sendError(res, 'Forbidden', 403);
  }

  const validation = UpsertVacationPolicyRequest.safeParse(req.body);
  if (!validation.success) {
    return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
  }

  try {
    const admin = await prisma.institutionAdmin.findUnique({
      where: { userId },
      select: { institutionId: true },
    });
    if (!admin) return sendError(res, 'Admin not found', 404);

    const policy = await prisma.institutionVacationPolicy.upsert({
      where: { institutionId: admin.institutionId },
      create: {
        institutionId: admin.institutionId,
        maxVacationDaysPerYear: validation.data.maxVacationDaysPerYear,
      },
      update: {
        maxVacationDaysPerYear: validation.data.maxVacationDaysPerYear,
      },
    });

    return sendSuccess(res, policy, 'Vacation policy updated');
  } catch (error) {
    console.error('Error upserting vacation policy:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};
