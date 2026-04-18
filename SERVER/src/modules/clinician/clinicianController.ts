import { UserRole } from "@prisma/client";
import prisma from "../../prisma";
import { sendSuccess, sendError } from "../../utils/apiResponse";

export const showClinician = async (req, res) => {
  const { role, institutionId, userId } = req.user;
  const id = Number(req.params.clinicianId || userId);

  try {
    const clinician = await prisma.clinician.findFirst({
      where: { id },
      include: { user: true, institution: true },
    });

    if (!clinician) {
      return sendError(res, 'Clinician not found', 404);
    }

    if (role !== UserRole.PROGRAMMER && userId !== clinician.userId && institutionId !== clinician.institutionId) {
      return sendError(res, 'Forbidden: Access denied', 403);
    }

    return sendSuccess(res, clinician, 'Clinician retrieved successfully');
  } catch (error) {
    console.error('Error retrieving clinician:', error);
    return sendError(res, 'Internal server error', 500);
  }
};

export const updateClinician = async (req, res) => {
  const { role, institutionId, id: userId } = req.user;
  const clinicianId = Number(req.params.clinicianId || userId);
  const { name, phone, email, birthDate, gender, nif, address} = req.body;

  try {
    if (!name || name.trim().length === 0) {
      return sendError(res, 'Name is required', 400);
    }

    const existingClinician = await prisma.clinician.findUnique({
      where: { id: clinicianId },
      include: {
        user: true,
      },
    });

    if (!existingClinician) {
      return sendError(res, 'Clinician not found', 404);
    }

    if (role !== UserRole.PROGRAMMER) {
      if (userId !== clinicianId && institutionId !== existingClinician.institutionId) {
        return sendError(res, 'Forbidden: You can only update your own data or clinicians from your institution', 403);
      }
    }

    // Check if email is being updated and validate uniqueness in User table
    if (email && email !== existingClinician.user.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: existingClinician.userId },
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
    };

    if (birthDate) {
      updateData.birthDate = new Date(birthDate);
    }

    // Use transaction to update both Clinician and User if email is changing
    const updatedClinician = await prisma.$transaction(async (tx) => {
      const clinician = await tx.clinician.update({
        where: { id: clinicianId },
        data: updateData,
        include: { user: true, institution: true },
      });

      // Update user email if provided and different
      if (email && email !== existingClinician.user.email) {
        await tx.user.update({
          where: { id: existingClinician.userId },
          data: { email: email.toLowerCase() },
        });
        // Update the email in the returned object
        clinician.user.email = email.toLowerCase();
      }

      return clinician;
    });

    return sendSuccess(res, updatedClinician, 'Clinician updated successfully');
  } catch (error) {
    console.error('Error updating clinician:', error);
    return sendError(res, 'Internal server error', 500);
  }
};