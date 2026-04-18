import path from "path";
import fs from 'fs';
import prisma from "../../prisma";
import { sendEmptySuccess, sendError, sendSuccess } from "../../utils/apiResponse";
import { TimelineService } from "../../services/timelineService";

export const uploadAvatar = async (req, res) => {
  const userId = req.user.userId;

  if (!req.file) {
    return sendError(res, 'Please upload a valid image file.', 400);
  }

  const newAvatarFile = req.file.filename;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, role: true }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const oldAvatar = user.avatarUrl;

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: newAvatarFile }
    });

    try {
      let userDetails = null;
      let institutionId = null;
      let userName = 'Unknown User';

      switch (user.role) {
        case 'ELDERLY':
          userDetails = await prisma.elderly.findFirst({
            where: { userId },
            select: { id: true, name: true, institutionId: true }
          });
          break;
        case 'CAREGIVER':
          userDetails = await prisma.caregiver.findFirst({
            where: { userId },
            select: { id: true, name: true, institutionId: true }
          });
          break;
        case 'CLINICIAN':
          userDetails = await prisma.clinician.findFirst({
            where: { userId },
            select: { id: true, name: true, institutionId: true }
          });
          break;
        case 'INSTITUTION_ADMIN':
          userDetails = await prisma.institutionAdmin.findFirst({
            where: { userId },
            select: { id: true, name: true, institutionId: true }
          });
          break;
      }

      if (userDetails && userDetails.institutionId) {
        await TimelineService.createUserActivity(
          userDetails.institutionId,
          { id: userDetails.id, role: user.role },
          userDetails.name,
          true
        );
      }
    } catch (timelineError) {
      console.error('Error creating timeline activity for avatar update:', timelineError);
    }

    deleteAvatarFile(oldAvatar);

    return sendSuccess(res, {
      message: 'Avatar uploaded successfully!',
      avatarUrl: newAvatarFile
    });
  } catch (err) {
    console.error('Avatar upload error:', err);

    const uploadedFilePath = path.join(__dirname, '../../../public/uploads/', newAvatarFile);
    if (fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    return sendError(res, 'Failed to upload avatar. Please try again.', 500);
  }
};

export const deleteAvatar = async (req, res) => {
  const userId = req.user.userId;

  if (!userId) {
    return sendError(res, 'Please login first.', 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const oldAvatar = user.avatarUrl;

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null }
    });

    deleteAvatarFile(oldAvatar);

    return sendEmptySuccess(res, 'Avatar deleted successfully!');
  } catch (err) {
    console.error(err);
    return sendError(res, 'Database error', 500);
  }
};


const deleteAvatarFile = (filename) => {
  if (!filename || filename.includes('default/')) {
    console.log('Skipping deletion of default avatar or empty filename:', filename);
    return;
  }

  const filepath = path.join(__dirname, '../../../../public/uploads/', filename);

  if (fs.existsSync(filepath)) {
    fs.unlink(filepath, (err) => {
      if (err) {
        console.error('Failed to delete old avatar:', err);
      } else {
        console.log('Old avatar deleted successfully:', filename);
      }
    });
  } else {
    console.log('Avatar file not found, skipping deletion:', filename);
  }
};

