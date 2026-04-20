import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './elderlyAbsenceController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const elderlyAbsenceRoutes = express.Router();

const STAFF = [UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER];
const ADMIN_ONLY = [UserRole.INSTITUTION_ADMIN, UserRole.PROGRAMMER];
const STAFF_OR_ELDERLY = [...STAFF, UserRole.ELDERLY];

// GET /elderly-absences/institution — all absences for admin's institution (must be before /:elderlyId)
elderlyAbsenceRoutes.get(
  '/institution',
  authenticate,
  authorizeRoles(ADMIN_ONLY),
  controller.getInstitutionAbsences,
);

// GET /elderly-absences/:elderlyId  — list absences for an elderly
elderlyAbsenceRoutes.get(
  '/:elderlyId',
  authenticate,
  authorizeRoles(STAFF_OR_ELDERLY),
  controller.getAbsences,
);

// POST /elderly-absences/:elderlyId  — create absence
elderlyAbsenceRoutes.post(
  '/:elderlyId',
  authenticate,
  authorizeRoles(STAFF),
  controller.createAbsence,
);

// PUT /elderly-absences/entry/:id  — update absence
elderlyAbsenceRoutes.put(
  '/entry/:id',
  authenticate,
  authorizeRoles(STAFF),
  controller.updateAbsence,
);

// DELETE /elderly-absences/entry/:id  — delete absence
elderlyAbsenceRoutes.delete(
  '/entry/:id',
  authenticate,
  authorizeRoles(STAFF),
  controller.deleteAbsence,
);

export default elderlyAbsenceRoutes;
