import { Router } from 'express';
import * as timelineController from './timelineController';
import { authenticate, authorizeRoles, authorizeSameInstitution } from '../../middleware/authMiddleware';
import { UserRole } from 'moveplus-shared';

const timelineRoutes = Router();

const institutionManagementRoles = [
  UserRole.CAREGIVER,
  UserRole.INSTITUTION_ADMIN,
  UserRole.CLINICIAN,
  UserRole.PROGRAMMER
];

timelineRoutes.get(
  '/',
  authenticate, authorizeRoles(institutionManagementRoles), authorizeSameInstitution,
  timelineController.indexInstitutionTimeline
);

timelineRoutes.get(
  '/:institutionId',
  authenticate, authorizeRoles([UserRole.PROGRAMMER]), authorizeSameInstitution,
  timelineController.indexInstitutionTimeline
);

export default timelineRoutes;