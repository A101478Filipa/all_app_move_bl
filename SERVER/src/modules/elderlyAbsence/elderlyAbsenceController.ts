import { CreateElderlyAbsenceRequest, UpdateElderlyAbsenceRequest } from 'moveplus-shared';
import { sendSuccess, sendError, sendInputValidationError, sendEmptySuccess } from '../../utils/apiResponse';
import prisma from '../../prisma';

const creatorSelect = {
  id: true,
  caregiver: { select: { name: true } },
  institutionAdmin: { select: { name: true } },
  clinician: { select: { name: true } },
  programmer: { select: { name: true } },
};

const formatCreator = (u: any) => ({
  id: u.id,
  name:
    u.caregiver?.name ||
    u.institutionAdmin?.name ||
    u.clinician?.name ||
    u.programmer?.name ||
    'Unknown',
});

// GET /elderly-absences/:elderlyId
export const getAbsences = async (req, res) => {
  const elderlyId = Number(req.params.elderlyId);

  try {
    const absences = await prisma.elderlyAbsence.findMany({
      where: { elderlyId },
      orderBy: { startDate: 'asc' },
      include: { createdBy: { select: creatorSelect } },
    });

    return sendSuccess(res, absences.map(a => ({ ...a, createdBy: formatCreator(a.createdBy) })));
  } catch (error) {
    console.error('Error fetching elderly absences:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// POST /elderly-absences/:elderlyId
export const createAbsence = async (req, res) => {
  const { userId } = req.user;
  const elderlyId = Number(req.params.elderlyId);

  const validation = CreateElderlyAbsenceRequest.safeParse(req.body);
  if (!validation.success) {
    return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
  }

  const { startDate, endDate, reason } = validation.data;
  if (endDate < startDate) return sendError(res, 'endDate must be after or equal to startDate', 400);

  try {
    const elderly = await prisma.elderly.findUnique({ where: { id: elderlyId }, select: { id: true } });
    if (!elderly) return sendError(res, 'Elderly not found', 404);

    const absence = await prisma.elderlyAbsence.create({
      data: { elderlyId, createdById: userId, startDate, endDate, reason: reason ?? null },
      include: { createdBy: { select: creatorSelect } },
    });

    return sendSuccess(res, { ...absence, createdBy: formatCreator(absence.createdBy) }, 'Absence created', 201);
  } catch (error) {
    console.error('Error creating elderly absence:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// PUT /elderly-absences/entry/:id
export const updateAbsence = async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.elderlyAbsence.findUnique({ where: { id } });
  if (!existing) return sendError(res, 'Absence not found', 404);

  const validation = UpdateElderlyAbsenceRequest.safeParse(req.body);
  if (!validation.success) {
    return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
  }

  try {
    const absence = await prisma.elderlyAbsence.update({
      where: { id },
      data: {
        ...(validation.data.startDate !== undefined && { startDate: validation.data.startDate }),
        ...(validation.data.endDate !== undefined && { endDate: validation.data.endDate }),
        ...('reason' in validation.data && { reason: validation.data.reason ?? null }),
      },
      include: { createdBy: { select: creatorSelect } },
    });

    return sendSuccess(res, { ...absence, createdBy: formatCreator(absence.createdBy) }, 'Absence updated');
  } catch (error) {
    console.error('Error updating elderly absence:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// DELETE /elderly-absences/entry/:id
export const deleteAbsence = async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.elderlyAbsence.findUnique({ where: { id } });
  if (!existing) return sendError(res, 'Absence not found', 404);

  try {
    await prisma.elderlyAbsence.delete({ where: { id } });
    return sendEmptySuccess(res, 'Absence deleted');
  } catch (error) {
    console.error('Error deleting elderly absence:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};
