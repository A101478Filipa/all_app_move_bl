import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './medicationController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const medicationRoutes = express.Router();

// Define routes
medicationRoutes.get(
  '/:medicationId',
  authenticate,
  controller.getMedication
);

export default medicationRoutes;