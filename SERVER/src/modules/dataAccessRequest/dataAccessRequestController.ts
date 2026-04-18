import prisma from '../../prisma';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { UserRole } from 'moveplus-shared';
import { DataAccessRequestStatus } from '@prisma/client';
import { sendDataAccessRequestNotification } from '../../utils/notificationHelpers';

/**
 * Create a new data access request
 * POST /api/data-access-requests
 */
export const createDataAccessRequest = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { elderlyId, notes } = req.body;

    if (role !== UserRole.CLINICIAN) {
      return sendError(res, 'Only clinicians can request data access', 403);
    }

    const clinician = await prisma.clinician.findUnique({
      where: { userId },
    });

    if (!clinician) {
      return sendError(res, 'Clinician profile not found', 404);
    }

    const elderly = await prisma.elderly.findUnique({
      where: { id: elderlyId },
    });

    if (!elderly) {
      return sendError(res, 'Elderly patient not found', 404);
    }

    const existingRequest = await prisma.dataAccessRequest.findUnique({
      where: {
        clinicianId_elderlyId: {
          clinicianId: clinician.id,
          elderlyId,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === DataAccessRequestStatus.PENDING) {
        return sendError(res, 'A pending request already exists for this patient', 409);
      }
      if (existingRequest.status === DataAccessRequestStatus.APPROVED) {
        return sendSuccess(res, existingRequest, 'You already have access to this patient data');
      }
    }

    const request = existingRequest
      ? await prisma.dataAccessRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: DataAccessRequestStatus.PENDING,
            requestedAt: new Date(),
            respondedAt: null,
            notes,
          },
          include: {
            elderly: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    pushToken: true,
                  },
                },
              },
            },
            clinician: {
              include: {
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
          },
        })
      : await prisma.dataAccessRequest.create({
          data: {
            clinicianId: clinician.id,
            elderlyId,
            notes,
          },
          include: {
            elderly: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    pushToken: true,
                  },
                },
              },
            },
            clinician: {
              include: {
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
          },
        });

    try {
      await sendDataAccessRequestNotification(
        request.elderly.user.id,
        request.elderly.user.pushToken,
        request.clinician.user.username,
        request.id
      );
    } catch (notificationError) {
      console.error('Error sending data access request notification:', notificationError);
    }

    sendSuccess(res, request, 'Data access request created successfully', 201);
  } catch (error) {
    console.error('Error creating data access request:', error);
    sendError(res, 'Failed to create data access request');
  }
};

/**
 * Get access requests for the authenticated user
 * GET /api/data-access-requests/my-requests
 */
export const getMyRequests = async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role === UserRole.CLINICIAN) {
      const clinician = await prisma.clinician.findUnique({
        where: { userId },
      });

      if (!clinician) {
        return sendError(res, 'Clinician profile not found', 404);
      }

      const requests = await prisma.dataAccessRequest.findMany({
        where: { clinicianId: clinician.id },
        include: {
          elderly: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      });

      return sendSuccess(res, requests);
    } else if (role === UserRole.ELDERLY) {
      const elderly = await prisma.elderly.findUnique({
        where: { userId },
      });

      if (!elderly) {
        return sendError(res, 'Elderly profile not found', 404);
      }

      const requests = await prisma.dataAccessRequest.findMany({
        where: { elderlyId: elderly.id },
        include: {
          clinician: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      });

      return sendSuccess(res, requests);
    } else if (role === UserRole.CAREGIVER || role === UserRole.INSTITUTION_ADMIN) {
      const profile = role === UserRole.CAREGIVER
        ? await prisma.caregiver.findUnique({ where: { userId } })
        : await prisma.institutionAdmin.findUnique({ where: { userId } });

      if (!profile) {
        return sendError(res, `${role === UserRole.CAREGIVER ? 'Caregiver' : 'Institution admin'} profile not found`, 404);
      }

      // Get all pending requests for elderly in their institution
      const requests = await prisma.dataAccessRequest.findMany({
        where: {
          elderly: {
            institutionId: profile.institutionId,
          },
          status: DataAccessRequestStatus.PENDING,
        },
        include: {
          elderly: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
          clinician: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      });

      return sendSuccess(res, requests);
    }

    sendError(res, 'Invalid user role for this operation', 403);
  } catch (error) {
    console.error('Error fetching data access requests:', error);
    sendError(res, 'Failed to fetch data access requests');
  }
};

/**
 * Respond to a data access request (approve or deny)
 * PATCH /api/data-access-requests/:id/respond
 */
export const respondToRequest = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (role !== UserRole.ELDERLY) {
      return sendError(res, 'Only elderly users can respond to access requests', 403);
    }

    if (
      status !== DataAccessRequestStatus.APPROVED &&
      status !== DataAccessRequestStatus.DENIED &&
      status !== DataAccessRequestStatus.REVOKED
    ) {
      return sendError(res, 'Invalid status. Must be APPROVED, DENIED, or REVOKED', 400);
    }

    const elderly = await prisma.elderly.findUnique({
      where: { userId },
    });

    if (!elderly) {
      return sendError(res, 'Elderly profile not found', 404);
    }

    const request = await prisma.dataAccessRequest.findUnique({
      where: { id: parseInt(id) },
    });

    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    if (request.elderlyId !== elderly.id) {
      return sendError(res, 'You are not authorized to respond to this request', 403);
    }

    const updatedRequest = await prisma.dataAccessRequest.update({
      where: { id: parseInt(id) },
      data: {
        status,
        respondedAt: new Date(),
      },
      include: {
        clinician: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    sendSuccess(res, updatedRequest, 'Request updated successfully');
  } catch (error) {
    console.error('Error responding to data access request:', error);
    sendError(res, 'Failed to respond to request');
  }
};

/**
 * Respond to a data access request as a caregiver (approve or deny on behalf of elderly)
 * PATCH /api/data-access-requests/:id/respond-as-caregiver
 */
export const respondToRequestAsCaregiver = async (req, res) => {
  try {
    const { userId, role, institutionId } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    // Only caregivers and institution admins can respond on behalf of elderly
    if (role !== UserRole.CAREGIVER && role !== UserRole.INSTITUTION_ADMIN) {
      return sendError(res, 'Only caregivers and institution admins can respond to access requests on behalf of elderly', 403);
    }

    if (
      status !== DataAccessRequestStatus.APPROVED &&
      status !== DataAccessRequestStatus.DENIED &&
      status !== DataAccessRequestStatus.REVOKED
    ) {
      return sendError(res, 'Invalid status. Must be APPROVED, DENIED, or REVOKED', 400);
    }

    // Get the access request with elderly information
    const request = await prisma.dataAccessRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        elderly: true,
      },
    });

    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    // Verify that the elderly belongs to the same institution as the caregiver
    if (request.elderly.institutionId !== institutionId) {
      return sendError(res, 'You can only respond to requests for elderly in your institution', 403);
    }

    // Update the request
    const updatedRequest = await prisma.dataAccessRequest.update({
      where: { id: parseInt(id) },
      data: {
        status,
        respondedAt: new Date(),
      },
      include: {
        elderly: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        clinician: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    sendSuccess(res, updatedRequest, 'Request updated successfully by caregiver');
  } catch (error) {
    console.error('Error responding to data access request as caregiver:', error);
    sendError(res, 'Failed to respond to request');
  }
};

/**
 * Check if clinician has access to elderly data
 * GET /api/data-access-requests/check-access/:elderlyId
 */
export const checkAccess = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { elderlyId } = req.params;

    if (role === UserRole.PROGRAMMER) {
      return sendSuccess(res, { hasAccess: true, status: 'PROGRAMMER_ACCESS' });
    }

    if (role !== UserRole.CLINICIAN) {
      return sendError(res, 'Only clinicians can check access', 403);
    }

    const clinician = await prisma.clinician.findUnique({
      where: { userId },
    });

    if (!clinician) {
      return sendError(res, 'Clinician profile not found', 404);
    }

    const request = await prisma.dataAccessRequest.findUnique({
      where: {
        clinicianId_elderlyId: {
          clinicianId: clinician.id,
          elderlyId: parseInt(elderlyId),
        },
      },
    });

    if (!request) {
      return sendSuccess(res, { hasAccess: false, status: null });
    }

    sendSuccess(res, {
      hasAccess: request.status === DataAccessRequestStatus.APPROVED,
      status: request.status,
      request,
    });
  } catch (error) {
    console.error('Error checking access:', error);
    sendError(res, 'Failed to check access');
  }
};
