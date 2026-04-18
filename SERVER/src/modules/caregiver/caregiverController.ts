import { UserRole } from "@prisma/client";
import prisma from "../../prisma";
import { sendSuccess, sendError } from "../../utils/apiResponse";

export const showCaregiver = async (req, res) => {
  const { role, institutionId, id: userId } = req.user;
  const id = Number(req.params.caregiverId || userId);

  try {
    const caregiver = await prisma.caregiver.findFirst({
      where: { id },
      include: { user: true, institution: true, },
    });

    if (!caregiver) {
      return sendError(res, 'Caregiver not found', 404);
    }

    if (role != UserRole.PROGRAMMER && institutionId != caregiver.institutionId && userId !== id) {
      return sendError(res, 'Forbidden: You do not belong to this institution', 403);
    }

    return sendSuccess(res, caregiver, 'Caregiver details retrieved successfully');
  } catch (error) {
    console.error('Error fetching caregiver details:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

export const updateCaregiver = async (req, res) => {
  const { role, institutionId, id: userId } = req.user;
  const caregiverId = Number(req.params.caregiverId || userId);
  const { name, phone, email, birthDate, gender, nif, address } = req.body;

  try {
    if (!name || name.trim().length === 0) {
      return sendError(res, 'Name is required', 400);
    }

    const existingCaregiver = await prisma.caregiver.findUnique({
      where: { id: caregiverId },
      include: {
        user: true,
      },
    });

    if (!existingCaregiver) {
      return sendError(res, 'Caregiver not found', 404);
    }

    if (role !== UserRole.PROGRAMMER) {
      if (userId !== caregiverId && institutionId !== existingCaregiver.institutionId) {
        return sendError(res, 'Forbidden: You can only update your own data or caregivers from your institution', 403);
      }
    }

    // Check if email is being updated and validate uniqueness in User table
    if (email && email !== existingCaregiver.user.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: existingCaregiver.userId },
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

    // Use transaction to update both Caregiver and User if email is changing
    const updatedCaregiver = await prisma.$transaction(async (tx) => {
      const caregiver = await tx.caregiver.update({
        where: { id: caregiverId },
        data: updateData,
        include: { user: true, institution: true },
      });

      // Update user email if provided and different
      if (email && email !== existingCaregiver.user.email) {
        await tx.user.update({
          where: { id: existingCaregiver.userId },
          data: { email: email.toLowerCase() },
        });
        // Update the email in the returned object
        caregiver.user.email = email.toLowerCase();
      }

      return caregiver;
    });

    return sendSuccess(res, updatedCaregiver, 'Caregiver updated successfully');
  } catch (error) {
    console.error('Error updating caregiver:', error);
    return sendError(res, 'Internal server error', 500);
  }
};