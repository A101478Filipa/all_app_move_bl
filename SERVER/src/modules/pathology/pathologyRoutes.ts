import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './pathologyController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const pathologyRoutes = express.Router();

// Define routes
pathologyRoutes.get(
  '/:pathologyId',
  authenticate,
  controller.getPathology
);

export default pathologyRoutes;