import express from 'express';
import * as controller from './programmerController';
import { authenticate } from '../../middleware/authMiddleware';

const programmerRoutes = express.Router();

programmerRoutes.get(
  '/:programmerId?',
  authenticate,
  controller.showProgrammer
);

programmerRoutes.put(
  '/:programmerId?',
  authenticate,
  controller.updateProgrammer
);

export default programmerRoutes;