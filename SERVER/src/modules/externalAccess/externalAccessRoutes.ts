import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './externalAccessController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const router = express.Router();

const viewRoles = [
  UserRole.INSTITUTION_ADMIN,
  UserRole.CAREGIVER,
  UserRole.CLINICIAN,
  UserRole.PROGRAMMER,
];

const generateRoles = [
  UserRole.INSTITUTION_ADMIN,
  UserRole.CAREGIVER,
];

// Authenticated routes (staff only)
router.post('/generate', authenticate, authorizeRoles(generateRoles), controller.generateToken);
router.get('/event/:calendarEventId', authenticate, authorizeRoles(viewRoles), controller.getTokenForEvent);
router.get('/visit-note/:calendarEventId', authenticate, authorizeRoles(viewRoles), controller.getVisitNote);

// Public routes (token-based — no JWT required)
router.get('/:token', controller.getProfileByToken);
router.post('/:token/submit', controller.submitVisitNote);
router.post('/:token/measurements', controller.addMeasurement);
router.post('/:token/medications', controller.addMedication);
router.post('/:token/pathologies', controller.addPathology);
router.post('/:token/falls', controller.addFall);
router.post('/:token/medications/:medicationId', controller.updateMedication);

export default router;
