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

// GET /time-off/policy — institution vacation policy (must be before /:userId)
timeOffRoutes.get(
  '/policy',
  authenticate,
  authorizeRoles(ADMIN_ONLY),
  controller.getVacationPolicy,
);

// PUT /time-off/policy — upsert institution vacation policy (must be before /:id)
timeOffRoutes.put(
  '/policy',
  authenticate,
  authorizeRoles(ADMIN_ONLY),
  controller.upsertVacationPolicy,
);

// GET /time-off/:userId  — list time-off for a user (self or admin)
timeOffRoutes.get(
  '/:userId',
  authenticate,
  authorizeRoles(ALL_STAFF),
  controller.getTimeOffs,
);

// POST /time-off  — all staff can submit a request
timeOffRoutes.post(
  '/',
  authenticate,
  authorizeRoles(ALL_STAFF),
  controller.createTimeOff,
);

// PUT /time-off/:id/respond  — admin approves or denies (must be before /:id)
timeOffRoutes.put(
  '/:id/respond',
  authenticate,
  authorizeRoles(ADMIN_ONLY),
  controller.respondTimeOff,
);

// PUT /time-off/:id  — update time-off (admin: any; staff: own PENDING)
timeOffRoutes.put(
  '/:id',
  authenticate,
  authorizeRoles(ALL_STAFF),
  controller.updateTimeOff,
);

// DELETE /time-off/:id  — delete time-off (admin: any; staff: own PENDING)
timeOffRoutes.delete(
  '/:id',
  authenticate,
  authorizeRoles(ALL_STAFF),
  controller.deleteTimeOff,
);

export default timeOffRoutes;
