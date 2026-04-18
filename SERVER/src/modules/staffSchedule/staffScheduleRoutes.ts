import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './staffScheduleController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const staffScheduleRoutes = express.Router();

// GET /staff-schedules/:userId  — get work schedule for a user
staffScheduleRoutes.get(
  '/:userId',
  authenticate,
  authorizeRoles([UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER]),
  controller.getWorkSchedule,
);

// PUT /staff-schedules/:userId  — upsert work schedule (Admin only)
staffScheduleRoutes.put(
  '/:userId',
  authenticate,
  authorizeRoles([UserRole.INSTITUTION_ADMIN, UserRole.PROGRAMMER]),
  controller.upsertWorkSchedule,
);

export default staffScheduleRoutes;
