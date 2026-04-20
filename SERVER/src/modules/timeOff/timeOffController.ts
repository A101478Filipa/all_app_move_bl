import { CreateTimeOffRequest, UpdateTimeOffRequest, UserRole } from 'moveplus-shared';
import { sendSuccess, sendError, sendInputValidationError, sendEmptySuccess } from '../../utils/apiResponse';
import prisma from '../../prisma';

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
      },
    });

    return sendSuccess(res, timeOffs.map(t => ({
      ...t,
      user: formatUser(t.user),
      createdBy: formatUser(t.createdBy),
    })));
  } catch (error) {
    console.error('Error fetching time-offs:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// POST /time-off
export const createTimeOff = async (req, res) => {
  const { userId: requesterId } = req.user;

  const validation = CreateTimeOffRequest.safeParse(req.body);
  if (!validation.success) {
    return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
  }

  const { userId, type, startDate, endDate, note } = validation.data;

  if (endDate < startDate) {
    return sendError(res, 'endDate must be after or equal to startDate', 400);
  }

  try {
    const timeOff = await prisma.staffTimeOff.create({
      data: { userId, createdById: requesterId, type, startDate, endDate, note: note ?? null },
      include: {
        user: { select: userSummarySelect },
        createdBy: { select: userSummarySelect },
      },
    });

    return sendSuccess(res, {
      ...timeOff,
      user: formatUser(timeOff.user),
      createdBy: formatUser(timeOff.createdBy),
    }, 'Time-off created', 201);
  } catch (error) {
    console.error('Error creating time-off:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// PUT /time-off/:id
export const updateTimeOff = async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.staffTimeOff.findUnique({ where: { id } });
  if (!existing) return sendError(res, 'Time-off not found', 404);

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
      },
    });

    return sendSuccess(res, {
      ...timeOff,
      user: formatUser(timeOff.user),
      createdBy: formatUser(timeOff.createdBy),
    }, 'Time-off updated');
  } catch (error) {
    console.error('Error updating time-off:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// DELETE /time-off/:id
export const deleteTimeOff = async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.staffTimeOff.findUnique({ where: { id } });
  if (!existing) return sendError(res, 'Time-off not found', 404);

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

  if (role !== UserRole.INSTITUTION_ADMIN && role !== UserRole.PROGRAMMER) {
    return sendError(res, 'Forbidden', 403);
  }

  try {
    const admin = await prisma.institutionAdmin.findUnique({
      where: { userId },
      select: { institutionId: true },
    });

    if (!admin) return sendError(res, 'Admin not found', 404);

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
      orderBy: { startDate: 'asc' },
      include: {
        user: { select: userSummarySelect },
        createdBy: { select: userSummarySelect },
      },
    });

    return sendSuccess(res, timeOffs.map(t => ({
      ...t,
      user: formatUser(t.user),
      createdBy: formatUser(t.createdBy),
    })));
  } catch (error) {
    console.error('Error fetching institution time-offs:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};
