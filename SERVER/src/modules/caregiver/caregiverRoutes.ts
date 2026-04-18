import express from 'express';
import * as controller from './caregiverController';
import { authenticate } from '../../middleware/authMiddleware';

const caregiverRoutes = express.Router();

// Define routes
caregiverRoutes.get(
  '/:caregiverId?',
  authenticate,
  controller.showCaregiver
);

caregiverRoutes.put(
  '/:caregiverId?',
  authenticate,
  controller.updateCaregiver
);

export default caregiverRoutes;