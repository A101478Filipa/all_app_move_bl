import { InvitationStatus, UserRole } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../../prisma';
import { sendSuccess, sendError, sendEmptySuccess } from '../../utils/apiResponse';
import {
  CreateInvitationRequest,
  CreateInvitationResponse,
  ValidateInvitationResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse
} from 'moveplus-shared';

/**
 * Create a new invitation
 * POST /api/invitations
 */
export const createInvitation = async (req, res) => {
  try {
    const { email, role, institutionId, invitedById, expiresInDays = 7 }: CreateInvitationRequest = req.body;

    if (!email || !role || !invitedById) {
      return sendError(res, 'Email, role, and invitedById are required', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return sendError(res, 'A user with this email already exists', 400);
    }

    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        status: InvitationStatus.PENDING
      }
    });

    if (existingInvitation) {
      return sendError(res, 'A pending invitation already exists for this email', 400);
    }

    const token = crypto.randomBytes(8).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: role as UserRole,
        institutionId: institutionId || null,
        invitedById,
        token,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            username: true,
          }
        },
        institution: institutionId ? {
          select: {
            id: true,
            name: true,
          }
        } : false,
      }
    });

    // TODO: Send invitation email to user
    // sendInvitationEmail(email, token);

    const responseData: CreateInvitationResponse = {
      id: invitation.id.toString(),
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt.toISOString(),
      invitedBy: {
        id: invitation.invitedBy.id,
        username: invitation.invitedBy.username,
      },
      institution: invitation.institution ? {
        id: invitation.institution.id,
        name: invitation.institution.name,
      } : undefined,
    };

    return sendSuccess(res, responseData, 'Invitation created successfully', 201);
  } catch (error) {
    console.error('Create invitation error:', error);
    return sendError(res, 'An error occurred while creating the invitation', 500);
  }
};

/**
 * Validate an invitation by token
 * GET /api/invitations/:token
 */
export const validateInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return sendError(res, 'Invitation token is required', 400);
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
          }
        },
        invitedBy: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    });

    if (!invitation) {
      return sendError(res, 'Invalid invitation token', 404);
    }

    if (new Date() > invitation.expiresAt) {
      if (invitation.status === InvitationStatus.PENDING) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED }
        });
      }

      return sendError(res, 'This invitation has expired', 400);
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      return sendError(res, 'This invitation has already been used', 400);
    }

    if (invitation.status === InvitationStatus.CANCELLED) {
      return sendError(res, 'This invitation has been cancelled', 400);
    }

    const responseData: ValidateInvitationResponse = {
      id: invitation.id.toString(),
      email: invitation.email,
      role: invitation.role,
      institutionId: invitation.institutionId || undefined,
      institutionName: invitation.institution?.name,
      invitedBy: invitation.invitedBy.username,
      expiresAt: invitation.expiresAt.toISOString(),
    };

    return sendSuccess(res, responseData, 'Invitation validated successfully');
  } catch (error) {
    console.error('Validate invitation error:', error);
    return sendError(res, 'An error occurred while validating the invitation', 500);
  }
};

/**
 * Accept an invitation and create user account
 * POST /api/invitations/:token/accept
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { username, password }: AcceptInvitationRequest = req.body;

    if (!token || !username || !password) {
      return sendError(res, 'Token, username, and password are required', 400);
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return sendError(res, 'Invalid invitation token', 404);
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return sendError(res, 'This invitation is no longer valid', 400);
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED }
      });

      return sendError(res, 'This invitation has expired', 400);
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (existingUsername) {
      return sendError(res, 'Username is already taken', 400);
    }

    // Check if email is already registered
    const existingEmail = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (existingEmail) {
      return sendError(res, 'Email is already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: username.toLowerCase(),
          email: invitation.email,
          password: hashedPassword,
          role: invitation.role,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        }
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.PROFILE_INCOMPLETE,
          acceptedAt: new Date(),
        }
      });

      return { user, email: invitation.email, institutionId: invitation.institutionId };
    });

    const responseData: AcceptInvitationResponse = {
      user: result.user,
      email: result.email,
      institutionId: result.institutionId || undefined,
    };

    return sendSuccess(res, responseData, 'Account created successfully. Please complete your profile.', 201);
  } catch (error) {
    console.error('Accept invitation error:', error);
    return sendError(res, 'An error occurred while accepting the invitation', 500);
  }
};

/**
 * Cancel an invitation
 * DELETE /api/invitations/:id
 */
export const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, 'Invitation ID is required', 400);
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!invitation) {
      return sendError(res, 'Invitation not found', 404);
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return sendError(res, 'Only pending invitations can be cancelled', 400);
    }

    await prisma.invitation.update({
      where: { id: parseInt(id) },
      data: { status: InvitationStatus.CANCELLED }
    });

    return sendEmptySuccess(res, 'Invitation cancelled successfully');
  } catch (error) {
    console.error('Cancel invitation error:', error);
    return sendError(res, 'An error occurred while cancelling the invitation', 500);
  }
};

/**
 * Get all invitations (with optional filters)
 * GET /api/invitations
 */
export const getInvitations = async (req, res) => {
  try {
    const { status, institutionId, invitedById } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as InvitationStatus;
    }

    if (institutionId) {
      where.institutionId = parseInt(institutionId as string);
    }

    if (invitedById) {
      where.invitedById = parseInt(invitedById as string);
    }

    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        invitedBy: {
          select: {
            id: true,
            username: true,
            caregiver: {
              select: {
                name: true,
              }
            },
            institutionAdmin: {
              select: {
                name: true,
              }
            }
          }
        },
        institution: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const responseData = invitations.map(inv => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      token: inv.token,
      expiresAt: inv.expiresAt,
      acceptedAt: inv.acceptedAt,
      createdAt: inv.createdAt,
      invitedBy: {
        id: inv.invitedBy.id,
        username: inv.invitedBy.username,
        name: inv.invitedBy.caregiver?.name || inv.invitedBy.institutionAdmin?.name || inv.invitedBy.username,
      },
      institution: inv.institution ? {
        id: inv.institution.id,
        name: inv.institution.name,
      } : null,
    }));

    return sendSuccess(res, responseData, 'Invitations retrieved successfully');
  } catch (error) {
    console.error('Get invitations error:', error);
    return sendError(res, 'An error occurred while fetching invitations', 500);
  }
};
