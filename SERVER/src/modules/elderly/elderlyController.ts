import { SearchElderlyResponse, UserRole } from "moveplus-shared";
import prisma from "../../prisma";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { DataAccessRequestStatus } from "@prisma/client";

export const searchElderlyByMedicalId = async (req, res) => {
  const { role, userId } = req.user;
  const { medicalId } = req.query;

  try {
    if (!medicalId) {
      return sendError(res, 'Medical ID is required', 400);
    }

    const medicalIdNumber = Number(medicalId);
    if (isNaN(medicalIdNumber)) {
      return sendError(res, 'Invalid medical ID format', 400);
    }

    const elderly = await prisma.elderly.findFirst({
      where: { medicalId: medicalIdNumber },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!elderly) {
      return sendSuccess(res, null, 'No elderly found with this medical ID');
    }

    if (role !== UserRole.CLINICIAN && role !== UserRole.PROGRAMMER) {
      return sendError(res, 'Forbidden: Only clinicians and programmers can search patients', 403);
    }

    let hasFullAccess = false;
    let accessRequest = null;

    if (role === UserRole.PROGRAMMER) {
      hasFullAccess = true;
    } else if (role === UserRole.CLINICIAN) {
      const clinician = await prisma.clinician.findUnique({
        where: { userId },
      });

      if (clinician) {
        accessRequest = await prisma.dataAccessRequest.findUnique({
          where: {
            clinicianId_elderlyId: {
              clinicianId: clinician.id,
              elderlyId: elderly.id,
            },
          },
        });

        hasFullAccess = accessRequest?.status === DataAccessRequestStatus.APPROVED;
      }
    }

    const data: SearchElderlyResponse = {
      id: elderly.id,
      medicalId: elderly.medicalId,
      name: elderly.name,
      birthDate: elderly.birthDate,
      gender: elderly.gender,
      user: {
        avatarUrl: elderly.user.avatarUrl,
      },
      hasFullAccess,
      accessRequest: accessRequest ? {
        id: accessRequest.id,
        status: accessRequest.status,
        requestedAt: accessRequest.requestedAt,
        respondedAt: accessRequest.respondedAt,
      } : null,
    };

    return sendSuccess(res, data, 'Elderly found');
  } catch (error) {
    console.error('Error searching for elderly:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

export const showElderly = async (req, res) => {
  const { role, institutionId, userId } = req.user;
  const id = Number(req.params.elderlyId || userId);

  try {
    const elderly = await prisma.elderly.findUnique({
      where: { id },
      include: {
        user: true,
        institution: true,
        measurements: true,
        pathologies: true,
        medications: true,
        fallOccurrences: true,
        sosOccurrences: true,
        woundTrackings: { select: { id: true } },
      }
    });

    if (!elderly) {
      return sendError(res, 'Elderly not found', 404);
    }

    if (role === UserRole.PROGRAMMER) {
      return sendSuccess(res, elderly, 'Elderly details retrieved successfully');
    }

    if (userId === id) {
      return sendSuccess(res, elderly, 'Elderly details retrieved successfully');
    }

    if (institutionId === elderly.institutionId) {
      return sendSuccess(res, elderly, 'Elderly details retrieved successfully');
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
              elderlyId: elderly.id,
            },
          },
        });

        if (accessRequest?.status === DataAccessRequestStatus.APPROVED) {
          return sendSuccess(res, elderly, 'Elderly details retrieved successfully');
        }
      }
    }

    return sendError(res, 'Forbidden: You do not have access to this patient', 403);
  } catch (error) {
    console.error('Error fetching elderly details:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

export const updateElderly = async (req, res) => {
  const { role, institutionId, id: userId } = req.user;
  const elderlyId = Number(req.params.elderlyId || userId);
  const { name, phone, email, birthDate, gender, nif, address, floor } = req.body;

  try {
    if (!name || name.trim().length === 0) {
      return sendError(res, 'Name is required', 400);
    }

    const existingElderly = await prisma.elderly.findUnique({
      where: { id: elderlyId },
      include: {
        user: true,
      },
    });

    if (!existingElderly) {
      return sendError(res, 'Elderly not found', 404);
    }

    if (role !== UserRole.PROGRAMMER) {
      if (userId !== elderlyId && institutionId !== existingElderly.institutionId) {
        return sendError(res, 'Forbidden: You can only update your own data or elderly from your institution', 403);
      }
    }

    // Check if email is being updated and validate uniqueness in User table
    if (email && email !== existingElderly.user.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: existingElderly.userId },
        },
      });

      if (emailExists) {
        return sendError(res, 'Email already in use', 409);
      }
    }

    const updateData: any = {
      name: name.trim(),
      phone: phone?.trim() || null,
      gender: gender || null,
      nif: nif?.trim() || null,           
      address: address?.trim() || null,
      floor: floor !== undefined ? (floor === null ? null : Number(floor)) : undefined,
    };

    if (birthDate) {
      updateData.birthDate = new Date(birthDate);
    }

    // Use transaction to update both Elderly and User if email is changing
    const updatedElderly = await prisma.$transaction(async (tx) => {
      const elderly = await tx.elderly.update({
        where: { id: elderlyId },
        data: updateData,
        include: {
          user: true,
          institution: true,
        },
      });

      // Update user email if provided and different
      if (email && email !== existingElderly.user.email) {
        await tx.user.update({
          where: { id: existingElderly.userId },
          data: { email: email.toLowerCase() },
        });
        // Update the email in the returned object
        elderly.user.email = email.toLowerCase();
      }

      return elderly;
    });

    return sendSuccess(res, updatedElderly, 'Elderly updated successfully');
  } catch (error) {
    console.error('Error updating elderly:', error);
    return sendError(res, 'Internal server error', 500);
  }
};