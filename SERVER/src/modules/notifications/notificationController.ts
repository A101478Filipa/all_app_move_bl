import { Response } from 'express';
import { AuthenticatedRequest } from '../../constants/AuthenticatedRequest';
import prisma from '../../prisma';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import notificationService from '../../services/notificationService';
import { getTranslation } from '../../localization/translation';
import {
  UserRole,
  FallDetectionAlertNotificationData,
  InactivityAlertNotificationData,
  NotificationKeys,
  NotificationType,
} from 'moveplus-shared';

/**
 * Register or update a user's push notification token
 */
export const registerPushToken = async (req: AuthenticatedRequest, res: Response) => {
  const { pushToken } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  if (!pushToken) {
    return sendError(res, 'Push token is required', 400);
  }

  if (!notificationService.isValidPushToken(pushToken)) {
    return sendError(res, 'Invalid push token format', 400);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { pushToken },
      select: { id: true, username: true, pushToken: true },
    });

    sendSuccess(res, { pushToken: updatedUser.pushToken }, 'Push token registered successfully');
  } catch (error) {
    console.error('Error registering push token:', error);
    sendError(res, 'Failed to register push token', 500);
  }
};

/**
 * Remove a user's push notification token (e.g., on logout)
 */
export const removePushToken = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { pushToken: null },
    });

    sendSuccess(res, null, 'Push token removed successfully');
  } catch (error) {
    console.error('Error removing push token:', error);
    sendError(res, 'Failed to remove push token', 500);
  }
};

/**
 * Get all notifications for the authenticated user
 * GET /api/notifications
 */
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  try {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    sendSuccess(res, { notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    sendError(res, 'Failed to fetch notifications', 500);
  }
};

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    if (notification.userId !== userId) {
      return sendError(res, 'Unauthorized', 403);
    }

    const updated = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    sendSuccess(res, updated, 'Notification marked as read');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    sendError(res, 'Failed to mark notification as read', 500);
  }
};

/**
 * Mark a notification as unread
 * PATCH /api/notifications/:id/unread
 */
export const markNotificationAsUnread = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    if (notification.userId !== userId) {
      return sendError(res, 'Unauthorized', 403);
    }

    const updated = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: {
        read: false,
        readAt: null,
      },
    });

    sendSuccess(res, updated, 'Notification marked as unread');
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    sendError(res, 'Failed to mark notification as unread', 500);
  }
};

/**
 * Mark all notifications as read for the authenticated user
 * PATCH /api/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    sendError(res, 'Failed to mark all notifications as read', 500);
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    if (notification.userId !== userId) {
      return sendError(res, 'Unauthorized', 403);
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    sendSuccess(res, null, 'Notification deleted successfully');
  } catch (error) {
    console.error('Error deleting notification:', error);
    sendError(res, 'Failed to delete notification', 500);
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  try {
    const count = await prisma.notification.count({
      where: { userId, read: false },
    });

    sendSuccess(res, { count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    sendError(res, 'Failed to fetch unread count', 500);
  }
};

/**
 * Handle fall detection alert from elderly app
 * POST /api/notifications/fall-alert
 */
export const reportFallAlert = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  if (userRole !== UserRole.ELDERLY) {
    return sendError(res, 'Only elderly users can use this endpoint', 403);
  }

  const { detectedAt, magnitude } = req.body;

  try {
    const elderly = await prisma.elderly.findUnique({
      where: { userId },
      include: {
        user: true,
        institution: {
          include: {
            caregivers: {
              include: {
                user: {
                  select: { id: true, pushToken: true, username: true },
                },
              },
            },
            admins: {
              include: {
                user: {
                  select: { id: true, pushToken: true, username: true },
                },
              },
            },
          },
        },
      }
    });

    if (!elderly) {
      return sendError(res, 'Elderly record not found', 404);
    }

    console.log(`[Fall Alert] Fall detected for elderly ${elderly.name} (ID: ${elderly.id})`);

    // Create a FallOccurrence record so it appears in the dashboard
    const fallOccurrence = await prisma.fallOccurrence.create({
      data: {
        elderlyId: elderly.id,
        date: new Date(detectedAt || new Date().toISOString()),
        injured: false,
      },
    });

    console.log(`[Fall Alert] Created FallOccurrence ID: ${fallOccurrence.id}`);

    const pushTokens: string[] = [];
    const userIdsToNotify: number[] = [];

    elderly.institution?.caregivers.forEach((caregiver) => {
      userIdsToNotify.push(caregiver.user.id);
      if (caregiver.user?.pushToken) {
        pushTokens.push(caregiver.user.pushToken);
      }
    });

    elderly.institution?.admins.forEach((admin) => {
      userIdsToNotify.push(admin.user.id);
      if (admin.user?.pushToken) {
        pushTokens.push(admin.user.pushToken);
      }
    });

    const userLang = 'pt';
    const pushTitle = getTranslation(userLang, 'fallDetectionAlertTitle');
    const pushBody = getTranslation(userLang, 'fallDetectionAlertBody', { elderlyName: elderly.name });

    const notificationData: FallDetectionAlertNotificationData = {
      type: NotificationType.FALL_DETECTION_ALERT,
      elderlyId: elderly.id,
      fallOccurrenceId: fallOccurrence.id,
      detectedAt: detectedAt || new Date().toISOString(),
      magnitude,
      timestamp: new Date().toISOString(),
      titleKey: NotificationKeys.fallDetectionAlert.titleKey,
      bodyKey: NotificationKeys.fallDetectionAlert.bodyKey,
      params: {
        elderlyName: elderly.name,
      },
    };

    const notificationRecords = await Promise.all(
      userIdsToNotify.map((targetUserId) =>
        prisma.notification.create({
          data: {
            userId: targetUserId,
            type: NotificationType.FALL_DETECTION_ALERT,
            title: pushTitle,
            body: pushBody,
            data: notificationData as any,
            read: false,
          },
        })
      )
    );

    console.log(`[Fall Alert] Created ${notificationRecords.length} notification records`);

    if (pushTokens.length > 0) {
      try {
        await notificationService.sendPushNotifications(
          pushTokens,
          pushTitle,
          pushBody,
          notificationData
        );
        console.log(`[Fall Alert] Sent push notifications to ${pushTokens.length} devices`);
      } catch (pushError) {
        console.error('[Fall Alert] Error sending push notifications:', pushError);
      }
    }

    return sendSuccess(res, {
      notificationsSent: userIdsToNotify.length,
      fallOccurrenceId: fallOccurrence.id,
      message: 'Fall alert sent to caregivers'
    }, 'Fall detected and caregivers notified', 200);
  } catch (error) {
    console.error('[Fall Alert] Error processing fall alert:', error);
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * Handle inactivity alert from elderly app
 * POST /api/notifications/inactivity-alert
 */
export const reportInactivityAlert = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  if (userRole !== UserRole.ELDERLY) {
    return sendError(res, 'Only elderly users can use this endpoint', 403);
  }

  const { detectedAt, inactiveDuration } = req.body;

  try {
    const elderly = await prisma.elderly.findUnique({
      where: { userId },
      include: {
        user: true,
        institution: {
          include: {
            caregivers: {
              include: {
                user: {
                  select: { id: true, pushToken: true, username: true },
                },
              },
            },
            admins: {
              include: {
                user: {
                  select: { id: true, pushToken: true, username: true },
                },
              },
            },
          },
        },
      }
    });

    if (!elderly) {
      return sendError(res, 'Elderly record not found', 404);
    }

    console.log(`[Inactivity Alert] Inactivity detected for elderly ${elderly.name} (ID: ${elderly.id})`);

    const pushTokens: string[] = [];
    const userIdsToNotify: number[] = [];

    elderly.institution?.caregivers.forEach((caregiver) => {
      userIdsToNotify.push(caregiver.user.id);
      if (caregiver.user?.pushToken) {
        pushTokens.push(caregiver.user.pushToken);
      }
    });

    elderly.institution?.admins.forEach((admin) => {
      userIdsToNotify.push(admin.user.id);
      if (admin.user?.pushToken) {
        pushTokens.push(admin.user.pushToken);
      }
    });

    const notificationData: InactivityAlertNotificationData = {
      type: NotificationType.INACTIVITY_ALERT,
      elderlyId: elderly.id,
      detectedAt: detectedAt || new Date().toISOString(),
      inactiveDuration,
      timestamp: new Date().toISOString(),
      titleKey: NotificationKeys.inactivityAlert.titleKey,
      bodyKey: NotificationKeys.inactivityAlert.bodyKey,
      params: {
        elderlyName: elderly.name,
      },
    };

    const notificationRecords = await Promise.all(
      userIdsToNotify.map((targetUserId) =>
        prisma.notification.create({
          data: {
            userId: targetUserId,
            type: NotificationType.INACTIVITY_ALERT,
            title: NotificationKeys.inactivityAlert.titleKey,
            body: NotificationKeys.inactivityAlert.bodyKey,
            data: notificationData as any,
            read: false,
          },
        })
      )
    );

    console.log(`[Inactivity Alert] Created ${notificationRecords.length} notification records`);

    if (pushTokens.length > 0) {
      try {
        await notificationService.sendPushNotifications(
          pushTokens,
          NotificationKeys.inactivityAlert.titleKey,
          NotificationKeys.inactivityAlert.bodyKey,
          notificationData
        );
        console.log(`[Inactivity Alert] Sent push notifications to ${pushTokens.length} devices`);
      } catch (pushError) {
        console.error('[Inactivity Alert] Error sending push notifications:', pushError);
      }
    }

    return sendSuccess(res, {
      notificationsSent: userIdsToNotify.length,
      message: 'Inactivity alert sent to caregivers'
    }, 'Inactivity detected and caregivers notified', 200);
  } catch (error) {
    console.error('[Inactivity Alert] Error processing inactivity alert:', error);
    return sendError(res, 'Internal server error', 500);
  }
};
