import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './measurementController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const measurementRoutes = express.Router();

// Define routes
measurementRoutes.get(
  '/:measurementId',
  authenticate,
  controller.getMeasurement
);

export default measurementRoutes;