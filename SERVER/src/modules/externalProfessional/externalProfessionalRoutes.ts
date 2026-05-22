import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './externalProfessionalController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const router = express.Router();

const allowedRoles = [
  UserRole.INSTITUTION_ADMIN,
  UserRole.CAREGIVER,
  UserRole.CLINICIAN,
  UserRole.PROGRAMMER,
];

router.get('/', authenticate, authorizeRoles(allowedRoles), controller.listExternalProfessionals);
router.post('/', authenticate, authorizeRoles(allowedRoles), controller.createExternalProfessional);
router.put('/:id', authenticate, authorizeRoles(allowedRoles), controller.updateExternalProfessional);
router.delete('/:id', authenticate, authorizeRoles(allowedRoles), controller.deleteExternalProfessional);

export default router;
