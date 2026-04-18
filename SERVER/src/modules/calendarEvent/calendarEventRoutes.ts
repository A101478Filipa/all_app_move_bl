import express from 'express';
import { UserRole } from 'moveplus-shared';
import * as controller from './calendarEventController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';

const calendarEventRoutes = express.Router();

// All routes require authentication
calendarEventRoutes.get(
  '/elderly/:elderlyId',
  authenticate,
  authorizeRoles([UserRole.ELDERLY, UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER]),
  controller.getCalendarEvents
);

calendarEventRoutes.post(
  '/elderly/:elderlyId',
  authenticate,
  authorizeRoles([UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER]),
  controller.createCalendarEvent
);

calendarEventRoutes.put(
  '/:eventId',
  authenticate,
  authorizeRoles([UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER]),
  controller.updateCalendarEvent
);

calendarEventRoutes.delete(
  '/:eventId',
  authenticate,
  authorizeRoles([UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER]),
  controller.deleteCalendarEvent
);

calendarEventRoutes.get(
  '/professional/:userId',
  authenticate,
  authorizeRoles([UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER]),
  controller.getProfessionalCalendarEvents
);

calendarEventRoutes.get(
  '/institution',
  authenticate,
  authorizeRoles([UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.PROGRAMMER]),
  controller.getInstitutionCalendarEvents
);

export default calendarEventRoutes;
