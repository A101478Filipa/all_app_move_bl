import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './fallOccurrenceController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const fallOccurrenceRoutes = express.Router();

// Define roles protections
const writeOccurrenceRoles = [
  UserRole.PROGRAMMER,
  UserRole.INSTITUTION_ADMIN,
  UserRole.CAREGIVER,
];

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

export default fallOccurrenceRoutes;