import express from 'express';
import * as controller from './clinicianController';
import { authenticate } from '../../middleware/authMiddleware';

const clinicianRoutes = express.Router();

// Define routes
clinicianRoutes.get(
  '/:clinicianId?',
  authenticate,
  controller.showClinician
);

clinicianRoutes.put(
  '/:clinicianId?',
  authenticate,
  controller.updateClinician
);

export default clinicianRoutes;