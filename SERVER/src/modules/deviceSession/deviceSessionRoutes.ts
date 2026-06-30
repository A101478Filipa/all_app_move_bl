import express from 'express';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';
import { uploadDeviceSessionPayload } from './deviceSessionUpload';
import { sendError } from '../../utils/apiResponse';
import { UserRole } from 'moveplus-shared';
import * as controller from './deviceSessionController';

const handleMulterError = (error, _req, res, next) => {
  if (error) return sendError(res, 'File upload error: ' + error.message, 400);
  next();
};

const writeRoles = [
  UserRole.PROGRAMMER,
  UserRole.INSTITUTION_ADMIN,
  UserRole.CAREGIVER,
  UserRole.CLINICIAN,
];

// Mounted at /api/device-sessions
const deviceSessionRoutes = express.Router();

deviceSessionRoutes.get('/by-elderly/:elderlyId',
  authenticate,
  controller.listDeviceSessionsForElderly,
);

deviceSessionRoutes.post('/by-elderly/:elderlyId',
  authenticate,
  authorizeRoles(writeRoles),
  uploadDeviceSessionPayload.single('payload'),
  handleMulterError,
  controller.createDeviceSession,
);

deviceSessionRoutes.get('/:id',         authenticate, controller.getDeviceSession);
deviceSessionRoutes.get('/:id/raw',     authenticate, controller.downloadDeviceSessionRaw);
deviceSessionRoutes.get('/:id/csv',     authenticate, controller.downloadDeviceSessionCsv);
deviceSessionRoutes.get('/:id/samples', authenticate, controller.getDeviceSessionSamples);
deviceSessionRoutes.delete('/:id',
  authenticate,
  authorizeRoles(writeRoles),
  controller.deleteDeviceSession,
);

export default deviceSessionRoutes;
