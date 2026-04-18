import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as registerController from './registerController';
import { authenticate, authorizeRoles, authorizeSameInstitution } from '../../../middleware/authMiddleware';

const registerRoutes = express.Router();

const elderlyRegistrationRoles = [
  UserRole.INSTITUTION_ADMIN,
  UserRole.CAREGIVER,
  UserRole.PROGRAMMER
];

const caregiverRegistrationRoles = [
  UserRole.INSTITUTION_ADMIN,
  UserRole.PROGRAMMER
];

const clinicianRegistrationRoles = [
  UserRole.PROGRAMMER
];

registerRoutes.post(
  '/elderly',
  authenticate,
  authorizeRoles(elderlyRegistrationRoles),
  authorizeSameInstitution,
  registerController.registerElderly
);

registerRoutes.post(
  '/caregiver',
  authenticate,
  authorizeRoles(caregiverRegistrationRoles),
  authorizeSameInstitution,
  registerController.registerCaregiver
);

registerRoutes.post(
  '/clinician/self',
  registerController.registerClinicianSelf
);

registerRoutes.post(
  '/clinician',
  authenticate,
  authorizeRoles(clinicianRegistrationRoles),
  registerController.registerClinician
);

export default registerRoutes;