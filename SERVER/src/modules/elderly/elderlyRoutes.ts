import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './elderlyController';
import * as fallOccurrenceController from '../fallOccurrence/fallOccurrenceController';
import * as sosOccurrenceController from '../sosOccurrence/sosOccurrenceController';
import * as medicationController from '../medication/medicationController';
import * as measurementController from '../measurements/measurementController';
import * as pathologyController from '../pathology/pathologyController';
import { authenticate, authorizeSameInstitution, authorizeRoles } from '../../middleware/authMiddleware';

const elderlyRoutes = express.Router();

elderlyRoutes.get(
  '/search/by-medical-id',
  authenticate,
  controller.searchElderlyByMedicalId
);

// Define routes
elderlyRoutes.get(
  '/:elderlyId?',
  authenticate,
  controller.showElderly
);

elderlyRoutes.put(
  '/:elderlyId?',
  authenticate,
  controller.updateElderly
);

elderlyRoutes.post(
  '/:elderlyId/fall-occurrences',
  authenticate, authorizeSameInstitution,
  fallOccurrenceController.createFallOccurrence
)

elderlyRoutes.post(
  '/:elderlyId/sos-occurrences',
  authenticate, authorizeSameInstitution,
  sosOccurrenceController.createSosOccurrence
)

elderlyRoutes.post(
  '/:elderlyId/medications',
  authenticate, authorizeSameInstitution,
  authorizeRoles([UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER]),
  medicationController.createMedication
)

elderlyRoutes.put(
  '/:elderlyId/medications/:medicationId',
  authenticate, authorizeSameInstitution,
  authorizeRoles([UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER]),
  medicationController.updateMedication
)

elderlyRoutes.post(
  '/:elderlyId/measurements',
  authenticate, authorizeSameInstitution,
  measurementController.createMeasurement
)

elderlyRoutes.get(
  '/:elderlyId/measurements',
  authenticate,
  measurementController.getElderlyMeasurementsByType
)

elderlyRoutes.post(
  '/:elderlyId/pathologies',
  authenticate, authorizeSameInstitution,
  authorizeRoles([UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER]),
  pathologyController.createPathology
)

elderlyRoutes.put(
  '/:elderlyId/pathologies/:pathologyId',
  authenticate, authorizeSameInstitution,
  authorizeRoles([UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER]),
  pathologyController.updatePathology
)

export default elderlyRoutes