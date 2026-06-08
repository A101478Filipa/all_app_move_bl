import { CalendarEventType, CreateCalendarEventRequest, UpdateCalendarEventRequest, UserRole } from 'moveplus-shared';
import { sendSuccess, sendError, sendInputValidationError, sendEmptySuccess } from '../../utils/apiResponse';
import prisma from '../../prisma';

const CLINICAL_EVENT_TYPES: CalendarEventType[] = [
  CalendarEventType.APPOINTMENT,
  CalendarEventType.PHYSIOTHERAPY,
  CalendarEventType.NURSING_CARE,
];

const userProfileSelect = {
  id: true,
  role: true,
  caregiver: { select: { name: true } },
  institutionAdmin: { select: { name: true } },
  clinician: { select: { name: true } },
  programmer: { select: { name: true } },
  elderly: { select: { name: true } },
};

const createdBySelect = userProfileSelect;

const externalProfessionalSelect = {
  id: true,
  name: true,
  specialty: true,
  phone: true,
};

const eventInclude = {
  createdBy: { select: createdBySelect },
  assignedTo: { select: userProfileSelect },
  externalProfessional: { select: externalProfessionalSelect },
} as const;

const formatUserProfile = (user: any) => ({
  id: user.id,
  role: user.role,
  name:
    user.caregiver?.name ||
    user.institutionAdmin?.name ||
    user.clinician?.name ||
    user.programmer?.name ||
    user.elderly?.name ||
    'Unknown',
});

const formatCreatedBy = formatUserProfile;

// GET /calendar-events/elderly/:elderlyId
export const getCalendarEvents = async (req, res) => {
  const { userId, role } = req.user;
  const elderlyId = Number(req.params.elderlyId);

  try {
    // Elderly can only see their own events
    if (role === UserRole.ELDERLY) {
      const elderly = await prisma.elderly.findUnique({ where: { userId }, select: { id: true } });
      if (!elderly || elderly.id !== elderlyId) {
        return sendError(res, 'Forbidden', 403);
      }
    }

    const events = await prisma.calendarEvent.findMany({
      where: { elderlyId },
      orderBy: { startDate: 'asc' },
      include: eventInclude,
    });

    return sendSuccess(res, events.map(e => ({
      ...e,
      createdBy: formatCreatedBy(e.createdBy),
      assignedTo: e.assignedTo ? formatUserProfile(e.assignedTo) : null,
    })));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// POST /calendar-events/elderly/:elderlyId
export const createCalendarEvent = async (req, res) => {
  const { userId, role } = req.user;
  const elderlyId = Number(req.params.elderlyId);

  try {
    const validation = CreateCalendarEventRequest.safeParse(req.body);
    if (!validation.success) {
      return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
    }

    const elderly = await prisma.elderly.findUnique({ where: { id: elderlyId }, select: { id: true } });
    if (!elderly) {
      return sendError(res, 'Elderly not found', 404);
    }

    // Block assignment if the target staff member is on time-off during the event period
    if (validation.data.assignedToId) {
      const eventStart = validation.data.startDate;
      const eventEnd = validation.data.endDate ?? validation.data.startDate;
      const conflictingTimeOff = await prisma.staffTimeOff.findFirst({
        where: {
          userId: validation.data.assignedToId,
          startDate: { lte: eventEnd },
          endDate: { gte: eventStart },
        },
      });
      if (conflictingTimeOff) {
        return sendError(res, 'O profissional está indisponível (férias/folga) nesse período.', 409);
      }
    }

    const eventStart = validation.data.startDate;
    const eventEnd = validation.data.endDate ?? validation.data.startDate;

    // Prepara as condições de conflito: queremos verificar o Idoso OU o Profissional
    const conflictConditions: any[] = [{ elderlyId }];
    if (validation.data.assignedToId) {
      conflictConditions.push({ assignedToId: validation.data.assignedToId });
    }

    // Procura na base de dados algum evento que se sobreponha
    const conflictingEvent = await prisma.calendarEvent.findFirst({
      where: {
        OR: conflictConditions,
        startDate: { lt: eventEnd }, // O evento existente começa antes do novo terminar
        endDate: { gt: eventStart }, // O evento existente termina depois do novo começar
      },
    });

    if (conflictingEvent) {
      const isElderlyConflict = conflictingEvent.elderlyId === elderlyId;
      const message = isElderlyConflict
        ? 'O idoso já tem um evento agendado para este horário.'
        : 'O profissional de saúde já tem um evento agendado para este horário.';
      
      // Alterado de sendError para sendInputValidationError
      return sendInputValidationError(res, message, []);
    }

    const event = await prisma.calendarEvent.create({
      data: {
        elderlyId,
        createdById: userId,
        type: validation.data.type,
        title: validation.data.title,
        description: validation.data.description,
        startDate: validation.data.startDate,
        endDate: validation.data.endDate,
        allDay: validation.data.allDay ?? false,
        location: validation.data.location,
        assignedToId: validation.data.assignedToId ?? null,
        externalProfessionalId: validation.data.externalProfessionalId ?? null,
        externalProfessionalName: validation.data.externalProfessionalName ?? null,
      },
      include: eventInclude,
    });

    return sendSuccess(res, {
      ...event,
      createdBy: formatCreatedBy(event.createdBy),
      assignedTo: event.assignedTo ? formatUserProfile(event.assignedTo) : null,
    }, 'Calendar event created', 201);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// PUT /calendar-events/:eventId
export const updateCalendarEvent = async (req, res) => {
  const { userId, role } = req.user;
  const eventId = Number(req.params.eventId);

  try {
    const existing = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
    if (!existing) {
      return sendError(res, 'Calendar event not found', 404);
    }

    // Only admin/programmer can update any event.
    // Clinicians and Caregivers can only update events they created or are assigned to.
    const isOwnerOrAssigned = existing.createdById === userId || existing.assignedToId === userId;
    if (role === UserRole.ELDERLY || (!isOwnerOrAssigned && (role === UserRole.CLINICIAN || role === UserRole.CAREGIVER))) {
      return sendError(res, 'Forbidden', 403);
    }

    const validation = UpdateCalendarEventRequest.safeParse(req.body);
    if (!validation.success) {
      return sendInputValidationError(res, 'Invalid request data', validation.error.errors);
    }

    // 1. DEFINIR AS VARIÁVEIS TOTAIS APENAS UMA VEZ
    const eventStart = validation.data.startDate ?? existing.startDate;
    const eventEnd = validation.data.endDate ?? existing.endDate ?? eventStart;
    const newAssignedToId = 'assignedToId' in validation.data ? validation.data.assignedToId : existing.assignedToId;

    // 2. VALIDAÇÃO DE DUPLO AGENDAMENTO (CONFLITOS DE HORÁRIO)
    const conflictConditions: any[] = [{ elderlyId: existing.elderlyId }];
    if (newAssignedToId) {
      conflictConditions.push({ assignedToId: newAssignedToId });
    }

    const conflictingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: { not: eventId }, // Ignora o próprio evento que está a ser editado
        OR: conflictConditions,
        AND: [
          { startDate: { lt: eventEnd } },
          {
            OR: [
              { endDate: { gt: eventStart } },
              { endDate: null, startDate: { equals: eventStart } }
            ]
          }
        ]
      },
    });

    if (conflictingEvent) {
      const isElderlyConflict = conflictingEvent.elderlyId === existing.elderlyId;
      const message = isElderlyConflict
        ? 'O idoso já tem outro evento agendado para este horário.'
        : 'O profissional de saúde já tem outro evento agendado para este horário.';
      
      // Alterado de sendError para sendInputValidationError
      return sendInputValidationError(res, message, []);
    }

    // 3. VALIDAÇÃO DE FÉRIAS/FOLGA (REUTILIZANDO AS VARIÁVEIS ACIMA)
    if (newAssignedToId) {
      const conflictingTimeOff = await prisma.staffTimeOff.findFirst({
        where: {
          userId: newAssignedToId,
          startDate: { lte: eventEnd },
          endDate: { gte: eventStart },
        },
      });
      if (conflictingTimeOff) {
        return sendError(res, 'O profissional está indisponível (férias/folga) nesse período.', 409);
      }
    }

    // 4. ATUALIZAÇÃO NA BASE DE DADOS
    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...(validation.data.type !== undefined && { type: validation.data.type }),
        ...(validation.data.title !== undefined && { title: validation.data.title }),
        ...(validation.data.description !== undefined && { description: validation.data.description }),
        ...(validation.data.startDate !== undefined && { startDate: validation.data.startDate }),
        ...(validation.data.endDate !== undefined && { endDate: validation.data.endDate }),
        ...(validation.data.allDay !== undefined && { allDay: validation.data.allDay }),
        ...(validation.data.location !== undefined && { location: validation.data.location }),
        ...('assignedToId' in validation.data && { assignedToId: validation.data.assignedToId ?? null }),
        ...('externalProfessionalId' in validation.data && { externalProfessionalId: validation.data.externalProfessionalId ?? null }),
        ...('externalProfessionalName' in validation.data && { externalProfessionalName: validation.data.externalProfessionalName ?? null }),
      },
      include: eventInclude,
    });

    return sendSuccess(res, {
      ...event,
      createdBy: formatCreatedBy(event.createdBy),
      assignedTo: event.assignedTo ? formatUserProfile(event.assignedTo) : null,
    }, 'Calendar event updated');
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// GET /calendar-events/professional/:userId
// Returns all calendar events assigned to a professional (by their userId).
// Accessible by the professional themselves or by INSTITUTION_ADMIN.
export const getProfessionalCalendarEvents = async (req, res) => {
  const { userId: requesterId, role } = req.user;
  const targetUserId = Number(req.params.userId);

  try {
    // Only the professional themselves or an admin can view this
    if (requesterId !== targetUserId && role !== UserRole.INSTITUTION_ADMIN && role !== UserRole.PROGRAMMER) {
      return sendError(res, 'Forbidden', 403);
    }

    const events = await prisma.calendarEvent.findMany({
      where: { assignedToId: targetUserId },
      orderBy: { startDate: 'asc' },
      include: {
        ...eventInclude,
        elderly: {
          select: {
            id: true,
            name: true,
            medicalId: true,
          },
        },
      },
    });

    return sendSuccess(res, events.map(e => ({
      ...e,
      createdBy: formatCreatedBy(e.createdBy),
      assignedTo: e.assignedTo ? formatUserProfile(e.assignedTo) : null,
    })));
  } catch (error) {
    console.error('Error fetching professional calendar events:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// GET /calendar-events/institution
// Returns all calendar events for the authenticated admin's institution.
// Accessible by INSTITUTION_ADMIN only (PROGRAMMER also allowed for debug).
export const getInstitutionCalendarEvents = async (req, res) => {
  const { userId, role } = req.user;

  try {
    // Resolve the admin's institutionId
    let institutionId: number | undefined;

    if (role === UserRole.INSTITUTION_ADMIN) {
      const admin = await prisma.institutionAdmin.findUnique({
        where: { userId },
        select: { institutionId: true },
      });
      if (!admin) return sendError(res, 'Admin profile not found', 404);
      institutionId = admin.institutionId;
    } else if (role === UserRole.CAREGIVER) {
      const caregiver = await prisma.caregiver.findUnique({
        where: { userId },
        select: { institutionId: true },
      });
      if (!caregiver) return sendError(res, 'Caregiver profile not found', 404);
      institutionId = caregiver.institutionId;
    } else if (role === UserRole.CLINICIAN) {
      const clinician = await prisma.clinician.findUnique({
        where: { userId },
        select: { institutionId: true },
      });
      if (!clinician) return sendError(res, 'Clinician profile not found', 404);
      institutionId = clinician.institutionId;
    } else if (role === UserRole.PROGRAMMER) {
      // Programmers may pass ?institutionId=N for debug; otherwise return empty
      institutionId = req.query.institutionId ? Number(req.query.institutionId) : undefined;
      if (!institutionId) return sendSuccess(res, []);
    } else {
      return sendError(res, 'Forbidden', 403);
    }

    const events = await prisma.calendarEvent.findMany({
      where: { elderly: { institutionId } },
      orderBy: { startDate: 'asc' },
      include: {
        ...eventInclude,
        elderly: {
          select: {
            id: true,
            name: true,
            medicalId: true,
          },
        },
      },
    });

    return sendSuccess(res, events.map(e => ({
      ...e,
      createdBy: formatCreatedBy(e.createdBy),
      assignedTo: e.assignedTo ? formatUserProfile(e.assignedTo) : null,
    })));
  } catch (error) {
    console.error('Error fetching institution calendar events:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

// DELETE /calendar-events/:eventId
export const deleteCalendarEvent = async (req, res) => {
  const { userId, role } = req.user;
  const eventId = Number(req.params.eventId);

  try {
    const existing = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
    if (!existing) {
      return sendError(res, 'Calendar event not found', 404);
    }

    // Only admin/programmer can delete any event.
    // Clinicians and Caregivers can only delete events they created or are assigned to.
    const isOwnerOrAssigned = existing.createdById === userId || existing.assignedToId === userId;
    if (role === UserRole.ELDERLY || (!isOwnerOrAssigned && (role === UserRole.CLINICIAN || role === UserRole.CAREGIVER))) {
      return sendError(res, 'Forbidden', 403);
    }

    await prisma.calendarEvent.delete({ where: { id: eventId } });

    return sendEmptySuccess(res, 'Calendar event deleted');
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};
