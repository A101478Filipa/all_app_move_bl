import { sendSuccess, sendError, sendInputValidationError } from '../../utils/apiResponse';
import prisma from '../../prisma';
import { z } from 'zod';

const CreateExternalProfessionalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  specialty: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const UpdateExternalProfessionalSchema = CreateExternalProfessionalSchema.partial();

const resolveInstitutionId = async (userId: number, role: string): Promise<number | null> => {
  if (role === 'INSTITUTION_ADMIN') {
    const r = await prisma.institutionAdmin.findUnique({ where: { userId }, select: { institutionId: true } });
    return r?.institutionId ?? null;
  }
  if (role === 'CAREGIVER') {
    const r = await prisma.caregiver.findUnique({ where: { userId }, select: { institutionId: true } });
    return r?.institutionId ?? null;
  }
  if (role === 'CLINICIAN') {
    const r = await prisma.clinician.findUnique({ where: { userId }, select: { institutionId: true } });
    return r?.institutionId ?? null;
  }
  return null;
};

// GET /external-professionals
export const listExternalProfessionals = async (req, res) => {
  const { userId, role, institutionId: tokenInstitutionId } = req.user;

  try {
    const institutionId = tokenInstitutionId ?? await resolveInstitutionId(userId, role);
    if (!institutionId) return sendError(res, 'Institution not found', 404);

    const professionals = await prisma.externalProfessional.findMany({
      where: { institutionId },
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, professionals);
  } catch (error) {
    console.error('Error listing external professionals:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// POST /external-professionals
export const createExternalProfessional = async (req, res) => {
  const { userId, role, institutionId: tokenInstitutionId } = req.user;

  try {
    const institutionId = tokenInstitutionId ?? await resolveInstitutionId(userId, role);
    if (!institutionId) return sendError(res, 'Institution not found', 404);

    const validation = CreateExternalProfessionalSchema.safeParse(req.body);
    if (!validation.success) {
      return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
    }

    const professional = await prisma.externalProfessional.create({
      data: {
        institutionId,
        name: validation.data.name,
        specialty: validation.data.specialty ?? null,
        phone: validation.data.phone ?? null,
        email: validation.data.email ?? null,
        notes: validation.data.notes ?? null,
      },
    });

    return sendSuccess(res, professional, 'External professional created', 201);
  } catch (error) {
    console.error('Error creating external professional:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// PUT /external-professionals/:id
export const updateExternalProfessional = async (req, res) => {
  const { userId, role, institutionId: tokenInstitutionId } = req.user;
  const id = Number(req.params.id);

  try {
    const institutionId = tokenInstitutionId ?? await resolveInstitutionId(userId, role);
    if (!institutionId) return sendError(res, 'Institution not found', 404);

    const existing = await prisma.externalProfessional.findUnique({ where: { id } });
    if (!existing) return sendError(res, 'External professional not found', 404);
    if (existing.institutionId !== institutionId) return sendError(res, 'Forbidden', 403);

    const validation = UpdateExternalProfessionalSchema.safeParse(req.body);
    if (!validation.success) {
      return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
    }

    const updated = await prisma.externalProfessional.update({
      where: { id },
      data: validation.data,
    });

    return sendSuccess(res, updated, 'External professional updated');
  } catch (error) {
    console.error('Error updating external professional:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// DELETE /external-professionals/:id
export const deleteExternalProfessional = async (req, res) => {
  const { userId, role, institutionId: tokenInstitutionId } = req.user;
  const id = Number(req.params.id);

  try {
    const institutionId = tokenInstitutionId ?? await resolveInstitutionId(userId, role);
    if (!institutionId) return sendError(res, 'Institution not found', 404);

    const existing = await prisma.externalProfessional.findUnique({ where: { id } });
    if (!existing) return sendError(res, 'External professional not found', 404);
    if (existing.institutionId !== institutionId) return sendError(res, 'Forbidden', 403);

    // Unlink events before deleting (set FK to null)
    await prisma.calendarEvent.updateMany({
      where: { externalProfessionalId: id },
      data: { externalProfessionalId: null },
    });

    await prisma.externalProfessional.delete({ where: { id } });

    return sendSuccess(res, null, 'External professional deleted');
  } catch (error) {
    console.error('Error deleting external professional:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};
