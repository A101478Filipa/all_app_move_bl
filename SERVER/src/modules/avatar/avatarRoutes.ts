import express from 'express'
import * as controller from './avatarController';
import { authenticate } from '../../middleware/authMiddleware';
import { upload } from '../../middleware/uploadMiddleware';
import { sendError } from '../../utils/apiResponse';

const avatarRoutes = express.Router();

const handleMulterError = (error, req, res, next) => {
  if (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File too large. Maximum size is 25MB.', 400);
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return sendError(res, 'Too many files. Only one file is allowed.', 400);
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return sendError(res, 'Unexpected field name. Use "avatar" as the field name.', 400);
    } else if (error.message.includes('Only') || error.message.includes('Invalid file type')) {
      return sendError(res, error.message, 400);
    } else {
      return sendError(res, 'File upload error: ' + error.message, 400);
    }
  }
  next();
};

avatarRoutes.post(
  '/upload',
  authenticate,
  upload.single('avatar'),
  handleMulterError,
  controller.uploadAvatar
);

avatarRoutes.delete(
  '/delete',
  authenticate,
  controller.deleteAvatar
);

export default avatarRoutes;