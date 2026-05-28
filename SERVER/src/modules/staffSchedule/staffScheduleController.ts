import { UpsertWorkScheduleRequest, UserRole } from 'moveplus-shared';
import { sendSuccess, sendError, sendInputValidationError } from '../../utils/apiResponse';
import prisma from '../../prisma';

// GET /staff-schedules/institution  — all staff schedules + approved time-offs (admin only)
export const getInstitutionSchedules = async (req, res) => {
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
      prisma.caregiver.findMany({ where: { institutionId: admin.institutionId }, select: { userId: true, name: true } }),
      prisma.clinician.findMany({ where: { institutionId: admin.institutionId }, select: { userId: true, name: true } }),
      prisma.institutionAdmin.findMany({ where: { institutionId: admin.institutionId }, select: { userId: true, name: true } }),
    ]);

    const staffList = [
      ...caregivers.map(s => ({ ...s, role: 'CAREGIVER' })),
      ...clinicians.map(s => ({ ...s, role: 'CLINICIAN' })),
      ...admins.map(s => ({ ...s, role: 'INSTITUTION_ADMIN' })),
    ];
    const staffUserIds = staffList.map(s => s.userId);

    const [schedules, timeOffs] = await Promise.all([
      prisma.staffWorkSchedule.findMany({ where: { userId: { in: staffUserIds } } }),
      prisma.staffTimeOff.findMany({
        where: {
          userId: { in: staffUserIds },
          status: 'APPROVED',
        },
        select: { userId: true, type: true, startDate: true, endDate: true, status: true },
      }),
    ]);

    const scheduleMap: Record<number, any> = {};
    for (const s of schedules) scheduleMap[s.userId] = s;

    const timeOffsByUser: Record<number, any[]> = {};
    for (const t of timeOffs) {
      if (!timeOffsByUser[t.userId]) timeOffsByUser[t.userId] = [];
      timeOffsByUser[t.userId].push(t);
    }

    return sendSuccess(res, staffList.map(s => ({
      userId: s.userId,
      name: s.name,
      role: s.role,
      schedule: scheduleMap[s.userId] ?? null,
      timeOffs: timeOffsByUser[s.userId] ?? [],
    })));
  } catch (error) {
    console.error('Error fetching institution schedules:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// GET /staff-schedules/:userId
export const getWorkSchedule = async (req, res) => {
  const { userId: requesterId, role } = req.user;
  const targetUserId = Number(req.params.userId);

  // Caregiver / Clinician can only see their own schedule
  if (
    role !== UserRole.INSTITUTION_ADMIN &&
    role !== UserRole.PROGRAMMER &&
    requesterId !== targetUserId
  ) {
    return sendError(res, 'Forbidden', 403);
  }

  try {
    const schedule = await prisma.staffWorkSchedule.findUnique({
      where: { userId: targetUserId },
    });
    return sendSuccess(res, schedule ?? null);
  } catch (error) {
    console.error('Error fetching work schedule:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// PUT /staff-schedules/:userId  (Admin only — upsert)
export const upsertWorkSchedule = async (req, res) => {
  const targetUserId = Number(req.params.userId);

  const validation = UpsertWorkScheduleRequest.safeParse(req.body);
  if (!validation.success) {
    return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
  }

  try {
    const schedule = await prisma.staffWorkSchedule.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        workDays: validation.data.workDays,
        startTime: validation.data.startTime,
        endTime: validation.data.endTime,
      },
      update: {
        workDays: validation.data.workDays,
        startTime: validation.data.startTime,
        endTime: validation.data.endTime,
      },
    });
    return sendSuccess(res, schedule, 'Work schedule updated');
  } catch (error) {
    console.error('Error upserting work schedule:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};
