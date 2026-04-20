import prisma from "../../prisma";
import {
  CreateFallOccurrenceRequest,
  HandleFallOccurrenceRequest,
  UserRole,
} from "moveplus-shared";
import { sendSuccess, sendError, sendInputValidationError } from "../../utils/apiResponse";
import { TimelineService } from "../../services/timelineService";
import { DataAccessRequestStatus } from "@prisma/client";
import { sendFallOccurrenceNotifications } from "../../utils/notificationHelpers";

export const createFallOccurrence = async (req, res) => {
  const elderlyId = Number(req.params.elderlyId);
  const request = CreateFallOccurrenceRequest.safeParse(req.body);

  if (!request.success) {
    return sendInputValidationError(res, 'Invalid request data', request.error.flatten());
  }

  try {
    const elderly = await prisma.elderly.findUniqueOrThrow({
      where: { id: Number(elderlyId) },
      include: { user: true }
    });

    const { detectionId, ...rest } = request.data;
    const detectionExists = detectionId && await prisma.fallDetection.findFirst({where: {
      id: detectionId
    }});

    const data = {
      elderlyId: elderly.id,
      ...rest,
      ...(detectionExists ? { detectionId } : {}),
    };

    const occurrence = await prisma.fallOccurrence.create({
      data,
      include: {
        elderly: {
          select: { name: true }
        }
      }
    });

    try {
      await TimelineService.createFallOccurrenceActivity(
        elderly.institutionId,
        { ...occurrence, elderly },
        false
      );
    } catch (timelineError) {
      console.error('Error creating timeline activity:', timelineError);
    }

    try {
      await sendFallOccurrenceNotifications(elderly.id, elderly.name, occurrence.id);
    } catch (notificationError) {
      console.error('Error sending fall occurrence notifications:', notificationError);
    }

    return sendSuccess(res, occurrence, 'Occurrence created with success', 201);
  } catch(error) {
    console.error('Error creating fall occurrence:', error);
    return sendError(res, 'Internal server error', 500);
  }
};

// TODO: Paginate or get start-end dates
export const indexInstitutionFallOccurrences = async (req, res) => {
  const institutionId = req.params.institutionId
    ? Number(req.params.institutionId)
    : Number(req.user.institutionId);

  if (!institutionId) {
    return sendError(res, 'Institution id not found on the request', 400);
  }

  const occurrences = await prisma.fallOccurrence.findMany({
    where: { elderly: { institutionId } },
    include: {
      elderly: {
        include: { user: true }
      },
      detection: true,
      handler: {
        include: {
          programmer: true,
          clinician: true,
          caregiver: true,
          elderly: true,
          institutionAdmin: true,
          externalPersonnel: true
        }
      }
    },
  });

  const enrichedFallOccurrences = occurrences.map(fall => {
    const { handler, ...fallData } = fall;
    let concreteHandler = null;

    if (handler) {
      concreteHandler =
        handler.programmer ??
        handler.clinician ??
        handler.caregiver ??
        handler.elderly ??
        handler.institutionAdmin ??
        handler.externalPersonnel ??
        null;
    }

    return {
      ...fallData,
      handler: concreteHandler
    };
  });

  return sendSuccess(res, enrichedFallOccurrences, `Fall occurrences on institution ${institutionId}`);
};

export const handleFallOccurrence = async (req, res) => {
  const occurrenceId = Number(req.params.occurrenceId);
  const request = HandleFallOccurrenceRequest.safeParse(req.body);

  if (!request.success) {
    return sendInputValidationError(res, 'Invalid request data', request.error.flatten());
  }

  try {
    const occurrence = await prisma.fallOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      include: {
        elderly: true,
        handler: true,
      }
    });

    if (occurrence.elderly.institutionId !== req.user.institutionId) {
      return sendError(res, 'You do not have permission to handle this occurrence', 403);
    }

    if (occurrence.handler != null) {
      return sendError(res, 'Occurrence already handled', 409);
    }

    const updated = await prisma.fallOccurrence.update({
      where: { id: occurrenceId },
      data: {
        handlerUserId: req.user.userId,
        ...request.data,
      },
      include: {
        elderly: {
          select: { name: true, institutionId: true }
        }
      }
    });

    try {
      await TimelineService.createFallOccurrenceActivity(
        updated.elderly.institutionId,
        { ...updated, elderly: updated.elderly },
        true
      );
    } catch (timelineError) {
      console.error('Error creating timeline activity for handled fall:', timelineError);
    }

    return sendSuccess(res, updated, 'Fall occurrence handled successfully');
  } catch (error) {
    console.error('Error handling fall occurrence:', error);
    return sendError(res, 'Internal server error', 500);
  }
};

export const indexFallOccurrence = async (req, res) => {
  const { role, institutionId, userId } = req.user;
  const occurrenceId = Number(req.params.occurrenceId);

  if (!occurrenceId) {
    return res.status(400).json({ message: 'Occurrence id is required' });
  }

  try {
    const occurrence = await prisma.fallOccurrence.findUnique({
      where: { id: occurrenceId },
      include: {
        elderly: { include: { user: true } },
        detection: true,
        handler: {
          include: {
            programmer: true,
            clinician: true,
            caregiver: true,
            elderly: true,
            institutionAdmin: true,
            externalPersonnel: true
          }
        }
      }
    });

    if (!occurrence) {
      return sendError(res, 'Occurrence not found', 404);
    }

    if (role === UserRole.PROGRAMMER) {
      let concreteHandler = null;
      if (occurrence.handler) {
        concreteHandler =
          occurrence.handler.programmer ??
          occurrence.handler.clinician ??
          occurrence.handler.caregiver ??
          occurrence.handler.elderly ??
          occurrence.handler.institutionAdmin ??
          occurrence.handler.externalPersonnel ??
          null;
      }
      return sendSuccess(res, { ...occurrence, handler: concreteHandler }, 'Occurrence fetched successfully');
    }

    if (institutionId === occurrence.elderly.institutionId) {
      let concreteHandler = null;
      if (occurrence.handler) {
        concreteHandler =
          occurrence.handler.programmer ??
          occurrence.handler.clinician ??
          occurrence.handler.caregiver ??
          occurrence.handler.elderly ??
          occurrence.handler.institutionAdmin ??
          occurrence.handler.externalPersonnel ??
          null;
      }
      return sendSuccess(res, { ...occurrence, handler: concreteHandler }, 'Occurrence fetched successfully');
    }

    if (role === UserRole.CLINICIAN) {
      const clinician = await prisma.clinician.findUnique({
        where: { userId },
      });

      if (clinician) {
        const accessRequest = await prisma.dataAccessRequest.findUnique({
          where: {
            clinicianId_elderlyId: {
              clinicianId: clinician.id,
              elderlyId: occurrence.elderly.id,
            },
          },
        });

        if (accessRequest?.status === DataAccessRequestStatus.APPROVED) {
          let concreteHandler = null;
          if (occurrence.handler) {
            concreteHandler =
              occurrence.handler.programmer ??
              occurrence.handler.clinician ??
              occurrence.handler.caregiver ??
              occurrence.handler.elderly ??
              occurrence.handler.institutionAdmin ??
              occurrence.handler.externalPersonnel ??
              null;
          }
          return sendSuccess(res, { ...occurrence, handler: concreteHandler }, 'Occurrence fetched successfully');
        }
      }
    }

    return sendError(res, 'Forbidden: You do not have access to this fall occurrence', 403);
  } catch (error) {
    console.error('Error fetching fall occurrence:', error);
    return sendError(res, 'Internal server error', 500);
  }
};

export const uploadFallOccurrencePhoto = async (req, res) => {
  const occurrenceId = Number(req.params.occurrenceId);

  if (!req.file) {
    return sendError(res, 'No photo file provided', 400);
  }

  try {
    const occurrence = await prisma.fallOccurrence.findUnique({
      where: { id: occurrenceId },
      include: { elderly: true },
    });

    if (!occurrence) {
      return sendError(res, 'Fall occurrence not found', 404);
    }

    if (occurrence.elderly.institutionId !== req.user.institutionId) {
      return sendError(res, 'You do not have permission to update this occurrence', 403);
    }

    const updated = await prisma.fallOccurrence.update({
      where: { id: occurrenceId },
      data: { injuryPhotoUrl: req.file.filename },
    });

    return sendSuccess(res, { injuryPhotoUrl: updated.injuryPhotoUrl }, 'Photo uploaded successfully');
  } catch (error) {
    console.error('Error uploading fall occurrence photo:', error);
    return sendError(res, 'Internal server error', 500);
  }
};
