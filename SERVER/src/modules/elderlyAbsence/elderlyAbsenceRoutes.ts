import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './elderlyAbsenceController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const elderlyAbsenceRoutes = express.Router();

const ADMIN_AND_CAREGIVER = [UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.PROGRAMMER];
const ADMIN_ONLY = [UserRole.INSTITUTION_ADMIN, UserRole.PROGRAMMER];
const STAFF_OR_ELDERLY = [UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER, UserRole.ELDERLY];

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

// POST /elderly-absences/:elderlyId  — create absence (admin + caregiver only)
elderlyAbsenceRoutes.post(
  '/:elderlyId',
  authenticate,
  authorizeRoles(ADMIN_AND_CAREGIVER),
  controller.createAbsence,
);

// PUT /elderly-absences/entry/:id  — update absence (admin + caregiver only)
elderlyAbsenceRoutes.put(
  '/entry/:id',
  authenticate,
  authorizeRoles(ADMIN_AND_CAREGIVER),
  controller.updateAbsence,
);

// DELETE /elderly-absences/entry/:id  — delete absence (admin + caregiver only)
elderlyAbsenceRoutes.delete(
  '/entry/:id',
  authenticate,
  authorizeRoles(ADMIN_AND_CAREGIVER),
  controller.deleteAbsence,
);

export default elderlyAbsenceRoutes;
