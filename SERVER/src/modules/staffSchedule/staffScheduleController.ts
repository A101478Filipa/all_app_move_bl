import { UpsertWorkScheduleRequest, UserRole } from 'moveplus-shared';
import { sendSuccess, sendError, sendInputValidationError } from '../../utils/apiResponse';
import prisma from '../../prisma';

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
