import express from 'express';
import {
  createDataAccessRequest,
  getMyRequests,
  respondToRequest,
  respondToRequestAsCaregiver,
  checkAccess,
} from './dataAccessRequestController';
import { authenticate } from '../../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a new access request
router.post('/', createDataAccessRequest);

// Get my requests (clinician's outgoing or elderly's incoming)
router.get('/my-requests', getMyRequests);

// Check if clinician has access to specific elderly
router.get('/check-access/:elderlyId', checkAccess);

// Respond to a request (approve/deny) - elderly only
router.patch('/:id/respond', respondToRequest);

// Respond to a request as caregiver (approve/deny on behalf of elderly) - caregiver/admin only
router.patch('/:id/respond-as-caregiver', respondToRequestAsCaregiver);

export default router;
