import { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../../prisma';
import { sendSuccess, sendError, sendInputValidationError } from '../../utils/apiResponse';
import { MeasurementType, MeasurementUnit, MeasurementStatus, MedicationStatus, PathologyStatus } from 'moveplus-shared';

// POST /external-access/generate  (authenticated — INSTITUTION_ADMIN or CAREGIVER only)
export const generateToken = async (req: Request, res: Response): Promise<void> => {
  const { calendarEventId } = req.body;

  if (!calendarEventId) {
    sendError(res, 'calendarEventId é obrigatório', 400);
    return;
  }

  try {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: Number(calendarEventId) },
      include: { externalProfessional: { select: { id: true, name: true, specialty: true } } },
    });

    if (!event) {
      sendError(res, 'Evento não encontrado', 404);
      return;
    }

    if (!event.externalProfessionalId) {
      sendError(res, 'Este evento não tem um profissional externo associado', 400);
      return;
    }

    // Expiry = 24 hours from now (the moment the token is generated)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Always regenerate: delete any existing token and create a fresh one
    const existing = await prisma.externalAccessToken.findUnique({
      where: { calendarEventId: event.id },
    });

    if (existing) {
      await prisma.externalAccessToken.delete({ where: { id: existing.id } });
    }

    // Same format as invitation tokens: 16 lowercase hex chars
    const token = crypto.randomBytes(8).toString('hex');

    const accessToken = await prisma.externalAccessToken.create({
      data: { token, calendarEventId: event.id, expiresAt },
    });

    sendSuccess(res, {
      token: accessToken.token,
      expiresAt: accessToken.expiresAt,
      professionalName: event.externalProfessional?.name ?? null,
    }, 'Token de acesso externo gerado');
  } catch (error) {
    console.error('generateToken error:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

// GET /external-access/event/:calendarEventId  (authenticated staff — get existing token for event)
export const getTokenForEvent = async (req: Request, res: Response): Promise<void> => {
  const calendarEventId = Number(req.params.calendarEventId);

  try {
    const token = await prisma.externalAccessToken.findUnique({
      where: { calendarEventId },
    });

    if (!token) {
      sendSuccess(res, null, 'Sem token');
      return;
    }

    sendSuccess(res, {
      token: token.token,
      expiresAt: token.expiresAt,
      isExpired: token.expiresAt <= new Date(),
    });
  } catch (error) {
    console.error('getTokenForEvent error:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

// GET /external-access/:token  (public — external professional views elderly profile)
export const getProfileByToken = async (req: Request, res: Response): Promise<void> => {
  const token = String(req.params.token);

  try {
    const accessToken = await prisma.externalAccessToken.findUnique({
      where: { token: token.toLowerCase().trim() },
      include: {
        calendarEvent: {
          include: {
            elderly: {
              include: {
                pathologies: {
                  orderBy: { createdAt: 'desc' },
                  select: { id: true, name: true, status: true, diagnosisDate: true, notes: true },
                },
                medications: {
                  orderBy: { createdAt: 'desc' },
                  select: { id: true, name: true, dosage: true, frequency: true, administration: true, status: true },
                },
                measurements: {
                  orderBy: { createdAt: 'desc' },
                  select: { id: true, type: true, value: true, unit: true, status: true, createdAt: true },
                },
                fallOccurrences: {
                  orderBy: { date: 'desc' },
                  take: 5,
                  select: { id: true, date: true, description: true, injured: true, injuryDescription: true },
                },
              },
            },
            externalProfessional: {
              select: { id: true, name: true, specialty: true },
            },
            externalVisitNote: true,
          },
        },
      },
    });

    if (!accessToken) {
      sendError(res, 'Código inválido', 404);
      return;
    }

    if (accessToken.expiresAt <= new Date()) {
      sendError(res, 'Código expirado', 410);
      return;
    }

    const ev = accessToken.calendarEvent;
    const elderly = ev.elderly;

    sendSuccess(res, {
      event: {
        id: ev.id,
        title: ev.title,
        type: ev.type,
        startDate: ev.startDate,
        endDate: ev.endDate,
      },
      professional: ev.externalProfessional,
      expiresAt: accessToken.expiresAt,
      elderly: {
        id: elderly.id,
        name: elderly.name,
        birthDate: elderly.birthDate,
        gender: elderly.gender,
        phone: elderly.phone ?? null,
        emergencyContact: elderly.emergencyContact ?? null,
        pathologies: elderly.pathologies,
        medications: elderly.medications,
        measurements: elderly.measurements,
        recentFalls: elderly.fallOccurrences,
      },
      visitNote: ev.externalVisitNote
        ? {
            notes: ev.externalVisitNote.notes,
            recommendations: ev.externalVisitNote.recommendations ?? null,
            submittedAt: ev.externalVisitNote.submittedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('getProfileByToken error:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

const VisitNoteSchema = z.object({
  notes: z.string().min(1, 'As observações são obrigatórias'),
  recommendations: z.string().optional().nullable(),
});

// POST /external-access/:token/submit  (public — external professional submits visit note)
export const submitVisitNote = async (req: Request, res: Response): Promise<void> => {
  const token = String(req.params.token);

  try {
    const accessToken = await prisma.externalAccessToken.findUnique({
      where: { token: token.toLowerCase().trim() },
      include: {
        calendarEvent: {
          include: { externalProfessional: { select: { name: true } } },
        },
      },
    });

    if (!accessToken) {
      sendError(res, 'Código inválido', 404);
      return;
    }

    if (accessToken.expiresAt <= new Date()) {
      sendError(res, 'Código expirado', 410);
      return;
    }

    const validation = VisitNoteSchema.safeParse(req.body);
    if (!validation.success) {
      sendInputValidationError(res, 'Dados inválidos', validation.error.errors);
      return;
    }

    const { notes, recommendations } = validation.data;

    const visitNote = await prisma.externalVisitNote.upsert({
      where: { calendarEventId: accessToken.calendarEventId },
      update: { notes, recommendations: recommendations ?? null, submittedAt: new Date() },
      create: {
        calendarEventId: accessToken.calendarEventId,
        professionalName: accessToken.calendarEvent.externalProfessional?.name ?? 'Profissional Externo',
        notes,
        recommendations: recommendations ?? null,
      },
    });

    sendSuccess(res, visitNote, 'Nota de visita submetida com sucesso');
  } catch (error) {
    console.error('submitVisitNote error:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

// GET /external-access/visit-note/:calendarEventId  (authenticated staff)
export const getVisitNote = async (req: Request, res: Response): Promise<void> => {
  const calendarEventId = Number(req.params.calendarEventId);

  try {
    const note = await prisma.externalVisitNote.findUnique({
      where: { calendarEventId },
    });

    sendSuccess(res, note ?? null);
  } catch (error) {
    console.error('getVisitNote error:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

// Helper: resolve token + validate expiry, returns { elderlyId, elderlyInstitutionId } or sends error
async function resolveToken(token: string, res: Response): Promise<{ elderlyId: number; institutionId: number } | null> {
  const accessToken = await prisma.externalAccessToken.findUnique({
    where: { token: token.toLowerCase().trim() },
    include: { calendarEvent: { include: { elderly: { select: { id: true, institutionId: true } } } } },
  });

  if (!accessToken) {
    sendError(res, 'Código inválido', 404);
    return null;
  }

  if (accessToken.expiresAt <= new Date()) {
    sendError(res, 'Código expirado', 410);
    return null;
  }

  return {
    elderlyId: accessToken.calendarEvent.elderly.id,
    institutionId: accessToken.calendarEvent.elderly.institutionId,
  };
}

// POST /external-access/:token/measurements  (public)
const ExternalMeasurementSchema = z.object({
  type: z.nativeEnum(MeasurementType),
  value: z.number(),
  unit: z.nativeEnum(MeasurementUnit),
  status: z.nativeEnum(MeasurementStatus).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const addMeasurement = async (req: Request, res: Response): Promise<void> => {
  const token = String(req.params.token);
  try {
    const ctx = await resolveToken(token, res);
    if (!ctx) return;

    const validation = ExternalMeasurementSchema.safeParse(req.body);
    if (!validation.success) {
      sendInputValidationError(res, 'Dados inválidos', validation.error.errors);
      return;
    }

    const d = validation.data;
    const measurement = await prisma.measurement.create({
      data: {
        elderlyId: ctx.elderlyId,
        type: d.type,
        value: d.value,
        unit: d.unit,
        status: d.status ?? null,
        notes: d.notes ?? null,
      },
      select: { id: true, type: true, value: true, unit: true, status: true, createdAt: true },
    });

    sendSuccess(res, measurement, 'Medição registada', 201);
  } catch (error) {
    console.error('addMeasurement error:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

// POST /external-access/:token/medications  (public)
const ExternalMedicationSchema = z.object({
  name: z.string().min(1),
  activeIngredient: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  administration: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.nativeEnum(MedicationStatus).optional(),
  notes: z.string().optional(),
});

export const addMedication = async (req: Request, res: Response): Promise<void> => {
  const token = String(req.params.token);
  try {
    const ctx = await resolveToken(token, res);
    if (!ctx) return;

    const validation = ExternalMedicationSchema.safeParse(req.body);
    if (!validation.success) {
      sendInputValidationError(res, 'Dados inválidos', validation.error.errors);
      return;
    }

    // registeredById is required in schema — use a sentinel system user or skip:
    // We reuse the elderly's own user record as proxy since external has no account.
    const elderly = await prisma.elderly.findUnique({
      where: { id: ctx.elderlyId },
      select: { userId: true },
    });

    if (!elderly) {
      sendError(res, 'Utente não encontrado', 404);
      return;
    }

    const d = validation.data;
    const medication = await prisma.medication.create({
      data: {
        elderlyId: ctx.elderlyId,
        registeredById: elderly.userId,
        name: d.name,
        activeIngredient: d.activeIngredient,
        dosage: d.dosage,
        frequency: d.frequency,
        administration: d.administration,
        startDate: d.startDate,
        endDate: d.endDate,
        status: d.status,
        notes: d.notes,
      },
      select: { id: true, name: true, dosage: true, frequency: true, administration: true, status: true },
    });

    sendSuccess(res, medication, 'Medicação registada', 201);
  } catch (error) {
    console.error('addMedication error:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

// POST /external-access/:token/pathologies  (public)
const ExternalPathologySchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  diagnosisSite: z.string().nullable().optional(),
  diagnosisDate: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(PathologyStatus).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const addPathology = async (req: Request, res: Response): Promise<void> => {
  const token = String(req.params.token);
  try {
    const ctx = await resolveToken(token, res);
    if (!ctx) return;

    const validation = ExternalPathologySchema.safeParse(req.body);
    if (!validation.success) {
      sendInputValidationError(res, 'Dados inválidos', validation.error.errors);
      return;
    }

    const elderly = await prisma.elderly.findUnique({
      where: { id: ctx.elderlyId },
      select: { userId: true },
    });

    if (!elderly) {
      sendError(res, 'Utente não encontrado', 404);
      return;
    }

    const d = validation.data;
    const pathology = await prisma.pathology.create({
      data: {
        elderlyId: ctx.elderlyId,
        registeredById: elderly.userId,
        name: d.name,
        description: d.description ?? null,
        diagnosisSite: d.diagnosisSite ?? null,
        diagnosisDate: d.diagnosisDate ?? null,
        status: d.status ?? null,
        notes: d.notes ?? null,
      },
      select: { id: true, name: true, status: true, diagnosisDate: true, notes: true },
    });

    sendSuccess(res, pathology, 'Patologia registada', 201);
  } catch (error) {
    console.error('addPathology error:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

// POST /external-access/:token/falls  (public)
const ExternalFallSchema = z.object({
  date: z.coerce.date(),
  description: z.string().optional(),
  injured: z.boolean(),
  injuryDescription: z.string().optional(),
  injuryBodyLocations: z.array(z.string()).optional(),
  measuresTaken: z.string().optional(),
});

export const addFall = async (req: Request, res: Response): Promise<void> => {
  const token = String(req.params.token);
  try {
    const ctx = await resolveToken(token, res);
    if (!ctx) return;

    const validation = ExternalFallSchema.safeParse(req.body);
    if (!validation.success) {
      sendInputValidationError(res, 'Dados inválidos', validation.error.errors);
      return;
    }

    const d = validation.data;
    const fall = await prisma.fallOccurrence.create({
      data: {
        elderlyId: ctx.elderlyId,
        date: d.date,
        description: d.description,
        injured: d.injured,
        injuryDescription: d.injuryDescription,
        injuryBodyLocations: d.injuryBodyLocations ?? [],
        measuresTaken: d.measuresTaken,
      },
      select: { id: true, date: true, description: true, injured: true, injuryDescription: true },
    });

    sendSuccess(res, fall, 'Queda registada', 201);
  } catch (error) {
    console.error('addFall error:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};
