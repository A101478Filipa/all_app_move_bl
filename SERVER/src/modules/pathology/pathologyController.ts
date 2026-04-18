import { CreatePathologyRequest, UpdatePathologyRequest, UserRole, PathologyStatus } from "moveplus-shared";
import { sendSuccess, sendInputValidationError, sendError } from "../../utils/apiResponse";
import prisma from "../../prisma";
import { TimelineService } from "../../services/timelineService";
import { DataAccessRequestStatus } from "@prisma/client";

export const createPathology = async (req, res) => {
  const { userId } = req.user;
  const elderlyId = Number(req.params.elderlyId);

  try {
    const validationResult = CreatePathologyRequest.safeParse(req.body);
    if (!validationResult.success) {
      return sendInputValidationError(res, 'Invalid request data', validationResult.error.errors);
    }

    const {
      name,
      description,
      diagnosisSite,
      diagnosisDate,
      status,
      notes
    } = validationResult.data;

    const elderly = await prisma.elderly.findUnique({
      where: { id: elderlyId },
      select: { id: true, name: true, institutionId: true }
    });

    if (!elderly) {
      return sendError(res, 'Elderly not found', 404);
    }

    const pathology = await prisma.pathology.create({
      data: {
        elderlyId,
        registeredById: userId,
        name,
        description,
        diagnosisSite,
        diagnosisDate,
        status,
        notes
      }
    });

    try {
      const registeredBy = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          caregiver: { select: { name: true } },
          elderly: { select: { name: true } },
          institutionAdmin: { select: { name: true } },
          clinician: { select: { name: true } },
          programmer: { select: { name: true } },
        }
      });

      const registeredByName = registeredBy?.caregiver?.name ||
        registeredBy?.elderly?.name ||
        registeredBy?.institutionAdmin?.name ||
        registeredBy?.clinician?.name ||
        registeredBy?.programmer?.name ||
        'Unknown User';

      await TimelineService.createPathologyActivity(
        elderly.institutionId,
        pathology,
        elderly.name,
        registeredByName
      );
    } catch (timelineError) {
      console.error('Error creating timeline activity:', timelineError);
    }

    return sendSuccess(res, pathology, 'Pathology created successfully', 201);
  } catch (error) {
    console.error('Error adding pathology:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

export const getPathology = async (req, res) => {
  const { role, institutionId, userId } = req.user;
  const pathologyId = Number(req.params.pathologyId);

  try {
    const pathology = await prisma.pathology.findUnique({
      where: { id: pathologyId },
      include: {
        elderly: {
          select: { id: true, name: true, institutionId: true }
        }
      }
    });

    if (!pathology) {
      return sendError(res, 'Pathology not found', 404);
    }

    if (role === UserRole.PROGRAMMER) {
      return sendSuccess(res, pathology, 'Pathology retrieved successfully');
    }

    if (institutionId === pathology.elderly.institutionId) {
      return sendSuccess(res, pathology, 'Pathology retrieved successfully');
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
              elderlyId: pathology.elderly.id,
            },
          },
        });

        if (accessRequest?.status === DataAccessRequestStatus.APPROVED) {
          return sendSuccess(res, pathology, 'Pathology retrieved successfully');
        }
      }
    }

    return sendError(res, 'Forbidden: You do not have access to this pathology', 403);
  } catch (error) {
    console.error('Error retrieving pathology:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

export const updatePathology = async (req, res) => {
  const { userId } = req.user;
  const elderlyId = Number(req.params.elderlyId);
  const pathologyId = Number(req.params.pathologyId);

  try {
    const validationResult = UpdatePathologyRequest.safeParse(req.body);
    if (!validationResult.success) {
      return sendInputValidationError(res, 'Invalid request data', validationResult.error.errors);
    }

    const {
      description,
      status,
      notes
    } = validationResult.data;

    const elderly = await prisma.elderly.findUnique({
      where: { id: elderlyId },
      select: { id: true, name: true, institutionId: true }
    });

    if (!elderly) {
      return sendError(res, 'Elderly not found', 404);
    }

    const existingPathology = await prisma.pathology.findFirst({
      where: {
        id: pathologyId,
        elderlyId: elderlyId
      }
    });

    if (!existingPathology) {
      return sendError(res, 'Pathology not found', 404);
    }

    const updatedPathology = await prisma.pathology.update({
      where: { id: pathologyId },
      data: {
        description,
        status,
        notes
      }
    });

    try {
      const registeredBy = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          caregiver: { select: { name: true } },
          elderly: { select: { name: true } },
          institutionAdmin: { select: { name: true } },
          clinician: { select: { name: true } },
          programmer: { select: { name: true } },
        }
      });

      const registeredByName = registeredBy?.caregiver?.name ||
        registeredBy?.elderly?.name ||
        registeredBy?.institutionAdmin?.name ||
        registeredBy?.clinician?.name ||
        registeredBy?.programmer?.name ||
        'Unknown User';

      await TimelineService.createPathologyActivity(
        elderly.institutionId,
        updatedPathology,
        elderly.name,
        registeredByName
      );
    } catch (timelineError) {
      console.error('Error creating timeline activity:', timelineError);
    }

    return sendSuccess(res, updatedPathology, 'Pathology updated successfully', 200);
  } catch (error) {
    console.error('Error updating pathology:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

