import { UserRole } from "@prisma/client";
import prisma from "../../prisma";
import { sendSuccess, sendError } from "../../utils/apiResponse";

export const showAdmin = async (req, res) => {
  const { role, institutionId, id: userId } = req.user;
  const id = Number(req.params.adminId || userId);

  try {
    const admin = await prisma.institutionAdmin.findUnique({
      where: { id },
      include: { user: true, institution: true, },
    });

    if (!admin) {
      return sendError(res, 'Institution Admin not found', 404);
    }

    if (role != UserRole.PROGRAMMER && institutionId != admin.institutionId && userId !== id) {
      return sendError(res, 'Forbidden: You do not belong to this institution', 403);
    }

    return sendSuccess(res, admin, 'Institution Admin details retrieved successfully');
  } catch (error) {
    console.error('Error fetching admin details:', error);
    return sendError(res, 'Internal Server Error', 500);
  }
};

export const updateAdmin = async (req, res) => {
  const { role, institutionId, id: userId } = req.user;
  const adminId = Number(req.params.adminId || userId);
  const { name, phoneNumber, email, birthDate, gender, nif, address } = req.body;

  try {
    if (!name || name.trim().length === 0) {
      return sendError(res, 'Name is required', 400);
    }

    const existingAdmin = await prisma.institutionAdmin.findUnique({
      where: { id: adminId },
      include: {
        user: true,
      },
    });

    if (!existingAdmin) {
      return sendError(res, 'Institution Admin not found', 404);
    }

    if (role !== UserRole.PROGRAMMER) {
      if (userId !== adminId && institutionId !== existingAdmin.institutionId) {
        return sendError(res, 'Forbidden: You can only update your own data or admins from your institution', 403);
      }
    }

    // Check if email is being updated and validate uniqueness in User table
    if (email && email !== existingAdmin.user.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: existingAdmin.userId },
        },
      });

      if (emailExists) {
        return sendError(res, 'Email already in use', 409);
      }
    }

    const updateData: any = {
      name: name.trim(),
      phoneNumber: phoneNumber?.trim() || null,
      gender: gender || null,
      nif: nif?.trim() || null,           
      address: address?.trim() || null, 
    };

    if (birthDate) {
      updateData.birthDate = new Date(birthDate);
    }

    // Use transaction to update both InstitutionAdmin and User if email is changing
    const updatedAdmin = await prisma.$transaction(async (tx) => {
      const admin = await tx.institutionAdmin.update({
        where: { id: adminId },
        data: updateData,
        include: { user: true, institution: true },
      });

      // Update user email if provided and different
      if (email && email !== existingAdmin.user.email) {
        await tx.user.update({
          where: { id: existingAdmin.userId },
          data: { email: email.toLowerCase() },
        });
        // Update the email in the returned object
        admin.user.email = email.toLowerCase();
      }

      return admin;
    });

    return sendSuccess(res, updatedAdmin, 'Institution Admin updated successfully');
  } catch (error) {
    console.error('Error updating admin:', error);
    return sendError(res, 'Internal server error', 500);
  }
};