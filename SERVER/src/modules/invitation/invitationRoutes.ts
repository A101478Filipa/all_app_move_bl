import express from 'express';
import * as controller from './invitationController';

const invitationRoutes = express.Router();

// Get all invitations (with optional filters)
invitationRoutes.get('/', controller.getInvitations);

// Validate invitation by token
invitationRoutes.get('/:token', controller.validateInvitation);

// Create new invitation
invitationRoutes.post('/', controller.createInvitation);

// Accept invitation and create account
invitationRoutes.post('/:token/accept', controller.acceptInvitation);

// Cancel invitation
invitationRoutes.delete('/:id', controller.cancelInvitation);

export default invitationRoutes;
