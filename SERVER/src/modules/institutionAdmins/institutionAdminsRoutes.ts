import express from 'express';
import * as controller from './institutionAdminsController';
import { authenticate } from '../../middleware/authMiddleware';

const adminsRoutes = express.Router();

// Define routes
adminsRoutes.get(
  '/:adminId?',
  authenticate,
  controller.showAdmin
);

adminsRoutes.put(
  '/:adminId?',
  authenticate,
  controller.updateAdmin
);

export default adminsRoutes;