import express from 'express';
import { UserRole } from 'moveplus-shared';
import {
  addFallWoundTracking,
  addSosWoundTracking,
  deleteWoundTracking,
  getFallWoundTrackings,
  getSosWoundTrackings,
} from './woundTrackingController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';
import { uploadIncidentPhoto } from '../../middleware/uploadMiddleware';
import { sendError } from '../../utils/apiResponse';

const woundTrackingRoutes = express.Router();

const deleteRoles = [
  UserRole.PROGRAMMER,
  UserRole.INSTITUTION_ADMIN,
  UserRole.CAREGIVER,
  UserRole.CLINICIAN,
];

const writeRoles = [
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

woundTrackingRoutes.get(
  '/fall-occurrences/:occurrenceId',
  authenticate,
  getFallWoundTrackings
);

woundTrackingRoutes.post(
  '/fall-occurrences/:occurrenceId',
  authenticate, authorizeRoles(writeRoles),
  uploadIncidentPhoto.single('photo'),
  handleMulterError,
  addFallWoundTracking
);

woundTrackingRoutes.get(
  '/sos-occurrences/:occurrenceId',
  authenticate,
  getSosWoundTrackings
);

woundTrackingRoutes.post(
  '/sos-occurrences/:occurrenceId',
  authenticate, authorizeRoles(writeRoles),
  uploadIncidentPhoto.single('photo'),
  handleMulterError,
  addSosWoundTracking
);

woundTrackingRoutes.delete(
  '/:trackingId',
  authenticate, authorizeRoles(deleteRoles),
  deleteWoundTracking
);

export default woundTrackingRoutes;
