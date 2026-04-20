import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './timeOffController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const timeOffRoutes = express.Router();

const ALL_STAFF = [UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER];
const ADMIN_ONLY = [UserRole.INSTITUTION_ADMIN, UserRole.PROGRAMMER];

// GET /time-off/institution — all time-offs for admin's institution (must be before /:userId)
timeOffRoutes.get(
  '/institution',
  authenticate,
  authorizeRoles(ADMIN_ONLY),
  controller.getInstitutionTimeOffs,
);

// GET /time-off/:userId  — list time-off for a user
timeOffRoutes.get(
  '/:userId',
  authenticate,
  authorizeRoles(ALL_STAFF),
  controller.getTimeOffs,
);

// POST /time-off  — create time-off (Admin only)
timeOffRoutes.post(
  '/',
  authenticate,
  authorizeRoles(ADMIN_ONLY),
  controller.createTimeOff,
);

// PUT /time-off/:id  — update time-off (Admin only)
timeOffRoutes.put(
  '/:id',
  authenticate,
  authorizeRoles(ADMIN_ONLY),
  controller.updateTimeOff,
);

// DELETE /time-off/:id  — delete time-off (Admin only)
timeOffRoutes.delete(
  '/:id',
  authenticate,
  authorizeRoles(ADMIN_ONLY),
  controller.deleteTimeOff,
);

export default timeOffRoutes;
