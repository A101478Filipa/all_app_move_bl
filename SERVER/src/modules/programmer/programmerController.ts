import { UserRole } from "@prisma/client";
import prisma from "../../prisma";
import { sendSuccess, sendError } from "../../utils/apiResponse";

export const showProgrammer = async (req, res) => {
  const { role, id: userId } = req.user;
  const id = Number(req.params.programmerId || userId);

  try {
    const programmer = await prisma.programmer.findFirst({
      where: { id },
      include: { user: true },
    });

    if (!programmer) {
      return sendError(res, 'Programmer not found', 404);
    }

    if (role !== UserRole.PROGRAMMER && userId !== id) {
      return sendError(res, 'Forbidden: Access denied', 403);
    }

    return sendSuccess(res, programmer, 'Programmer retrieved successfully');
  } catch (error) {
    console.error('Error retrieving programmer:', error);
    return sendError(res, 'Internal server error', 500);
  }
};

export const updateProgrammer = async (req, res) => {
  const { role, id: userId } = req.user;
  const programmerId = Number(req.params.programmerId || userId);
  const { name, phone, email, birthDate, gender } = req.body;

  try {
    if (role !== UserRole.PROGRAMMER && userId !== programmerId) {
      return sendError(res, 'Forbidden: You can only update your own data', 403);
    }

    if (!name || name.trim().length === 0) {
      return sendError(res, 'Name is required', 400);
    }

    const existingProgrammer = await prisma.programmer.findUnique({
      where: { id: programmerId },
      include: {
        user: true,
      },
    });

    if (!existingProgrammer) {
      return sendError(res, 'Programmer not found', 404);
    }

    // Check if email is being updated and validate uniqueness in User table
    if (email && email !== existingProgrammer.user.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: existingProgrammer.userId },
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
    };

    if (birthDate) {
      updateData.birthDate = new Date(birthDate);
    }

    // Use transaction to update both Programmer and User if email is changing
    const updatedProgrammer = await prisma.$transaction(async (tx) => {
      const programmer = await tx.programmer.update({
        where: { id: programmerId },
        data: updateData,
        include: { user: true },
      });

      // Update user email if provided and different
      if (email && email !== existingProgrammer.user.email) {
        await tx.user.update({
          where: { id: existingProgrammer.userId },
          data: { email: email.toLowerCase() },
        });
        // Update the email in the returned object
        programmer.user.email = email.toLowerCase();
      }

      return programmer;
    });

    return sendSuccess(res, updatedProgrammer, 'Programmer updated successfully');
  } catch (error) {
    console.error('Error updating programmer:', error);
    return sendError(res, 'Internal server error', 500);
  }
};