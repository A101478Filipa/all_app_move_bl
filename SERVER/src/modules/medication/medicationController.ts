import { CreateMedicationRequest, UpdateMedicationRequest, UserRole } from "moveplus-shared";
import { sendSuccess, sendInputValidationError, sendError } from "../../utils/apiResponse";
import prisma from "../../prisma";
import { TimelineService } from "../../services/timelineService";
import { DataAccessRequestStatus } from "@prisma/client";

export const createMedication = async (req, res) => {
  const { userId } = req.user;
  const elderlyId = Number(req.params.elderlyId);

  try {
    const validationResult = CreateMedicationRequest.safeParse(req.body);
    if (!validationResult.success) {
      return sendInputValidationError(res, 'Invalid request data', validationResult.error.errors);
    }

    const {
      name,
      activeIngredient,
      dosage,
      frequency,
      administration,
      startDate,
      endDate,
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

    const medication = await prisma.medication.create({
      data: {
        elderlyId,
        registeredById: userId,
        name,
        activeIngredient,
        dosage,
        frequency,
        administration,
        startDate,
        endDate,
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

      await TimelineService.createMedicationActivity(
        elderly.institutionId,
        medication,
        elderly.name,
        registeredByName,
        false
      );
    } catch (timelineError) {
      console.error('Error creating timeline activity:', timelineError);
    }

    return sendSuccess(res, medication, 'Medication created successfully', 201);
  } catch (error) {
    console.error('Error adding medication:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

export const updateMedication = async (req, res) => {
  const { userId } = req.user;
  const elderlyId = Number(req.params.elderlyId);
  const medicationId = Number(req.params.medicationId);

  try {
    const validationResult = UpdateMedicationRequest.safeParse(req.body);
    if (!validationResult.success) {
      return sendInputValidationError(res, 'Invalid request data', validationResult.error.errors);
    }

    const {
      dosage,
      frequency,
      administration,
      endDate,
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

    const existingMedication = await prisma.medication.findFirst({
      where: {
        id: medicationId,
        elderlyId: elderlyId
      }
    });

    if (!existingMedication) {
      return sendError(res, 'Medication not found', 404);
    }

    const updatedMedication = await prisma.medication.update({
      where: { id: medicationId },
      data: {
        dosage,
        frequency,
        administration,
        endDate,
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

      await TimelineService.createMedicationActivity(
        elderly.institutionId,
        updatedMedication,
        elderly.name,
        registeredByName,
        true
      );
    } catch (timelineError) {
      console.error('Error creating timeline activity:', timelineError);
    }

    return sendSuccess(res, updatedMedication, 'Medication updated successfully', 200);
  } catch (error) {
    console.error('Error updating medication:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

export const getMedication = async (req, res) => {
  const { role, institutionId, userId } = req.user;
  const medicationId = Number(req.params.medicationId);

  try {
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
      include: {
        elderly: {
          select: { id: true, name: true, institutionId: true }
        }
      }
    });

    if (!medication) {
      return sendError(res, 'Medication not found', 404);
    }

    if (role === UserRole.PROGRAMMER) {
      return sendSuccess(res, medication, 'Medication retrieved successfully');
    }

    if (institutionId === medication.elderly.institutionId) {
      return sendSuccess(res, medication, 'Medication retrieved successfully');
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
              elderlyId: medication.elderly.id,
            },
          },
        });

        if (accessRequest?.status === DataAccessRequestStatus.APPROVED) {
          return sendSuccess(res, medication, 'Medication retrieved successfully');
        }
      }
    }

    return sendError(res, 'Forbidden: You do not have access to this medication', 403);
  } catch (error) {
    console.error('Error retrieving medication:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};