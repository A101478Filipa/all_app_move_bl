import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './fallOccurrenceController';
import * as woundController from '../woundTracking/woundTrackingController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';
import { uploadIncidentPhoto } from '../../middleware/uploadMiddleware';
import { sendError } from '../../utils/apiResponse';

const fallOccurrenceRoutes = express.Router();

// Define roles protections
const writeOccurrenceRoles = [
  UserRole.PROGRAMMER,
  UserRole.INSTITUTION_ADMIN,
  UserRole.CAREGIVER,
];

const handleMulterError = (error, req, res, next) => {
  if (error) {
    return sendError(res, 'File upload error: ' + error.message, 400);
  }
  next();
};

// Define routes
fallOccurrenceRoutes.get(
  '/:occurrenceId',
  authenticate,
  controller.indexFallOccurrence
);

fallOccurrenceRoutes.put(
  '/:occurrenceId',
  authenticate, authorizeRoles(writeOccurrenceRoles),
  controller.handleFallOccurrence
);

fallOccurrenceRoutes.post(
  '/:occurrenceId/photo',
  authenticate, authorizeRoles(writeOccurrenceRoles),
  uploadIncidentPhoto.single('photo'),
  handleMulterError,
  controller.uploadFallOccurrencePhoto
);

fallOccurrenceRoutes.get(
  '/:occurrenceId/wound-tracking',
  authenticate,
  woundController.getFallWoundTrackings
);

fallOccurrenceRoutes.post(
  '/:occurrenceId/wound-tracking',
  authenticate, authorizeRoles(writeOccurrenceRoles),
  uploadIncidentPhoto.single('photo'),
  handleMulterError,
  woundController.addFallWoundTracking
);

export default fallOccurrenceRoutes;