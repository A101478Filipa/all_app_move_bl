import { CreateMeasurementRequest, UserRole, MeasurementType } from "moveplus-shared";
import { sendSuccess, sendInputValidationError, sendError } from "../../utils/apiResponse";
import prisma from "../../prisma";
import { TimelineService } from "../../services/timelineService";
import { DataAccessRequestStatus } from "@prisma/client";

export const createMeasurement = async (req, res) => {
  const elderlyId = Number(req.params.elderlyId);

  try {
    const validationResult = CreateMeasurementRequest.safeParse(req.body);
    if (!validationResult.success) {
      return sendInputValidationError(res, 'Invalid request data', validationResult.error.errors);
    }

    const {
      assessmentId,
      type,
      value,
      unit,
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

    if (assessmentId) {
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: { id: true }
      });

      if (!assessment) {
        return sendError(res, 'Assessment not found', 404);
      }
    }

    const measurement = await prisma.measurement.create({
      data: {
        elderlyId,
        assessmentId: assessmentId || null,
        type,
        value,
        unit,
        status: status ?? null,
        notes,
      }
    });

    try {
      await TimelineService.createMeasurementActivity(
        elderly.institutionId,
        measurement,
        elderly.name
      );
    } catch (timelineError) {
      console.error('Error creating timeline activity:', timelineError);
    }

    return sendSuccess(res, measurement, 'Measurement created successfully', 201);
  } catch (error) {
    console.error('Error adding measurement:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

export const getMeasurement = async (req, res) => {
  const { role, institutionId, userId } = req.user;
  const measurementId = Number(req.params.measurementId);

  try {
    const measurement = await prisma.measurement.findUnique({
      where: { id: measurementId },
      include: {
        elderly: {
          select: { id: true, name: true, institutionId: true }
        }
      }
    });

    if (!measurement) {
      return sendError(res, 'Measurement not found', 404);
    }

    if (role === UserRole.PROGRAMMER) {
      return sendSuccess(res, measurement, 'Measurement retrieved successfully');
    }

    if (institutionId === measurement.elderly.institutionId) {
      return sendSuccess(res, measurement, 'Measurement retrieved successfully');
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
              elderlyId: measurement.elderly.id,
            },
          },
        });

        if (accessRequest?.status === DataAccessRequestStatus.APPROVED) {
          return sendSuccess(res, measurement, 'Measurement retrieved successfully');
        }
      }
    }

    return sendError(res, 'Forbidden: You do not have access to this measurement', 403);
  } catch (error) {
    console.error('Error retrieving measurement:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

export const getElderlyMeasurementsByType = async (req, res) => {
  const { role, institutionId, userId } = req.user;
  const elderlyId = Number(req.params.elderlyId);
  const { type } = req.query;

  try {
    if (!type || !Object.values(MeasurementType).includes(type as MeasurementType)) {
      return sendError(res, 'Invalid or missing measurement type', 400);
    }

    const elderly = await prisma.elderly.findUnique({
      where: { id: elderlyId },
      select: { id: true, institutionId: true }
    });

    if (!elderly) {
      return sendError(res, 'Elderly not found', 404);
    }

    let hasAccess = false;

    if (role === UserRole.PROGRAMMER) {
      hasAccess = true;
    } else if (institutionId === elderly.institutionId) {
      hasAccess = true;
    } else if (role === UserRole.CLINICIAN) {
      const clinician = await prisma.clinician.findUnique({
        where: { userId },
      });

      if (clinician) {
        const accessRequest = await prisma.dataAccessRequest.findUnique({
          where: {
            clinicianId_elderlyId: {
              clinicianId: clinician.id,
              elderlyId: elderly.id,
            },
          },
        });

        if (accessRequest?.status === DataAccessRequestStatus.APPROVED) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return sendError(res, 'Forbidden: You do not have access to this elderly\'s measurements', 403);
    }

    const measurements = await prisma.measurement.findMany({
      where: {
        elderlyId,
        type: type as any
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return sendSuccess(res, measurements, 'Measurements retrieved successfully');
  } catch (error) {
    console.error('Error retrieving measurements:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};