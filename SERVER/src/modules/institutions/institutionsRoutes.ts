import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './institutionsController';
import * as fallOccurrencesController from '../fallOccurrence/fallOccurrenceController';
import * as timelineController from '../timeline/timelineController';
import { authenticate, authorizeRoles, authorizeSameInstitution } from '../../middleware/authMiddleware';

const institutionsRoutes = express.Router();

// Define roles protections
const institutionManagementRoles = [
  UserRole.INSTITUTION_ADMIN,
  UserRole.CAREGIVER,
  UserRole.CLINICIAN
];

institutionsRoutes.get(
  '/',
  authenticate, authorizeRoles([UserRole.PROGRAMMER]),
  controller.indexInstitutions
);

institutionsRoutes.post(
  '/',
  authenticate, authorizeRoles([UserRole.PROGRAMMER]),
  controller.createInstitution
);

institutionsRoutes.get(
  '/users',
  authenticate, authorizeRoles(institutionManagementRoles), authorizeSameInstitution,
  controller.indexInstitutionUsers
);

institutionsRoutes.get(
  '/:institutionId/users',
  authenticate, authorizeRoles([UserRole.PROGRAMMER]), authorizeSameInstitution,
  controller.indexInstitutionUsers
);

institutionsRoutes.get(
  '/fall-occurrences',
  authenticate, authorizeRoles(institutionManagementRoles), authorizeSameInstitution,
  fallOccurrencesController.indexInstitutionFallOccurrences
);

institutionsRoutes.get(
  '/:institutionId/fall-occurrences',
  authenticate, authorizeRoles([UserRole.PROGRAMMER]), authorizeSameInstitution,
  fallOccurrencesController.indexInstitutionFallOccurrences
);

institutionsRoutes.get(
  '/timeline',
  authenticate, authorizeRoles(institutionManagementRoles), authorizeSameInstitution,
  timelineController.indexInstitutionTimeline
);

institutionsRoutes.get(
  '/:institutionId/timeline',
  authenticate, authorizeRoles([UserRole.PROGRAMMER]), authorizeSameInstitution,
  timelineController.indexInstitutionTimeline
);

export default institutionsRoutes;