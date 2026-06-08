import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './externalProfessionalController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const router = express.Router();

// All institution roles can list and create (needed for calendar event picker)
const readRoles = [
  UserRole.INSTITUTION_ADMIN,
  UserRole.CAREGIVER,
  UserRole.CLINICIAN,
  UserRole.PROGRAMMER,
];

// Only admins (and programmers) can edit or delete external professionals
const writeRoles = [
  UserRole.INSTITUTION_ADMIN,
  UserRole.PROGRAMMER,
];

router.get('/', authenticate, authorizeRoles(readRoles), controller.listExternalProfessionals);
router.post('/', authenticate, authorizeRoles(readRoles), controller.createExternalProfessional);
router.put('/:id', authenticate, authorizeRoles(writeRoles), controller.updateExternalProfessional);
router.delete('/:id', authenticate, authorizeRoles(writeRoles), controller.deleteExternalProfessional);

export default router;
