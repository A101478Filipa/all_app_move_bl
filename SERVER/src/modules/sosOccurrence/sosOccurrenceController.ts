import prisma from '../../prisma';
import { CreateSosOccurrenceRequest, HandleSosOccurrenceRequest } from 'moveplus-shared';
import { sendSuccess, sendError, sendInputValidationError } from '../../utils/apiResponse';
import { sendSosOccurrenceNotifications } from '../../utils/notificationHelpers';

// Mesmo padrão do fallOccurrenceController: o handler é um User com sub-relações
const handlerInclude = {
  programmer: true,
  clinician: true,
  caregiver: true,
  institutionAdmin: true,
  externalPersonnel: true,
} as const;

function resolveHandler(handler: any) {
  if (!handler) return null;
  return (
    handler.caregiver ??
    handler.institutionAdmin ??
    handler.clinician ??
    handler.programmer ??
    handler.externalPersonnel ??
    null
  );
}

export const createSosOccurrence = async (req, res) => {
  const elderlyId = Number(req.params.elderlyId);
  const request = CreateSosOccurrenceRequest.safeParse(req.body);

  if (!request.success) {
    return sendInputValidationError(res, 'Invalid request data', request.error.flatten());
  }

  try {
    const elderly = await prisma.elderly.findUniqueOrThrow({
      where: { id: elderlyId },
      include: { user: true },
    });

    const occurrence = await prisma.sosOccurrence.create({
      data: {
        elderlyId: elderly.id,
        ...request.data,
      },
      include: {
        elderly: { select: { name: true } },
      },
    });

    try {
      await sendSosOccurrenceNotifications(elderly.id, elderly.name, occurrence.id);
    } catch (notificationError) {
      console.error('Error sending SOS notifications:', notificationError);
    }

    return sendSuccess(res, occurrence, 'SOS occurrence created with success', 201);
  } catch (error) {
    console.error('Error creating SOS occurrence:', error);
    return sendError(res, 'Internal server error', 500);
  }
};

export const indexSosOccurrence = async (req, res) => {
  const occurrenceId = Number(req.params.occurrenceId);

  try {
    const occurrence = await prisma.sosOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      include: {
        elderly: {
          include: { user: { select: { avatarUrl: true } } },
        },
        handler: { include: handlerInclude },
      },
    });
    const { handler, ...data } = occurrence;
    return sendSuccess(res, { ...data, handler: resolveHandler(handler) });
  } catch (error) {
    return sendError(res, 'SOS occurrence not found', 404);
  }
};

export const indexInstitutionSosOccurrences = async (req, res) => {
  const institutionId = req.params.institutionId
    ? Number(req.params.institutionId)
    : Number(req.user.institutionId);

  if (!institutionId) {
    return sendError(res, 'Institution id not found on the request', 400);
  }

  const occurrences = await prisma.sosOccurrence.findMany({
    where: { elderly: { institutionId } },
    include: {
      elderly: {
        include: { user: { select: { avatarUrl: true } } },
      },
      handler: { include: handlerInclude },
    },
    orderBy: { date: 'desc' },
  });

  const enriched = occurrences.map(({ handler, ...data }) => ({
    ...data,
    handler: resolveHandler(handler),
  }));

  return sendSuccess(res, enriched);
};

export const handleSosOccurrence = async (req, res) => {
  const occurrenceId = Number(req.params.occurrenceId);
  const request = HandleSosOccurrenceRequest.safeParse(req.body);

  if (!request.success) {
    return sendInputValidationError(res, 'Invalid request data', request.error.flatten());
  }

  try {
    const occurrence = await prisma.sosOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      include: { elderly: true },
    });

    if (occurrence.elderly.institutionId !== req.user.institutionId) {
      return sendError(res, 'You do not have permission to handle this occurrence', 403);
    }

    if (occurrence.handlerUserId != null) {
      return sendError(res, 'SOS occurrence already handled', 409);
    }

    const updated = await prisma.sosOccurrence.update({
      where: { id: occurrenceId },
      data: {
        handlerUserId: req.user.userId,
        ...request.data,
      },
      include: {
        elderly: { select: { name: true, institutionId: true } },
        handler: { include: handlerInclude },
      },
    });
    const { handler, ...data } = updated;
    return sendSuccess(res, { ...data, handler: resolveHandler(handler) });
  } catch (error) {
    console.error('Error handling SOS occurrence:', error);
    return sendError(res, 'Internal server error', 500);
  }
};
