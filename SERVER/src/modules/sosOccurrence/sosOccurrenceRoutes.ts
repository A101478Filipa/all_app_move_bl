import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './sosOccurrenceController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';
import { uploadIncidentPhoto } from '../../middleware/uploadMiddleware';
import { sendError } from '../../utils/apiResponse';

const sosOccurrenceRoutes = express.Router();

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

// GET /sos-occurrences/institution  (uses req.user.institutionId)
sosOccurrenceRoutes.get(
  '/institution',
  authenticate,
  controller.indexInstitutionSosOccurrences
);

// GET /sos-occurrences/institution/:institutionId  (explicit id, antes de /:occurrenceId para evitar conflito)
sosOccurrenceRoutes.get(
  '/institution/:institutionId',
  authenticate,
  controller.indexInstitutionSosOccurrences
);

// GET /sos-occurrences/:occurrenceId
sosOccurrenceRoutes.get(
  '/:occurrenceId',
  authenticate,
  controller.indexSosOccurrence
);

// PUT /sos-occurrences/:occurrenceId
sosOccurrenceRoutes.put(
  '/:occurrenceId',
  authenticate, authorizeRoles(writeOccurrenceRoles),
  controller.handleSosOccurrence
);

// POST /sos-occurrences/:occurrenceId/photo
sosOccurrenceRoutes.post(
  '/:occurrenceId/photo',
  authenticate, authorizeRoles(writeOccurrenceRoles),
  uploadIncidentPhoto.single('photo'),
  handleMulterError,
  controller.uploadSosOccurrencePhoto
);

export default sosOccurrenceRoutes;
