import express from 'express';
import {
  registerPushToken,
  removePushToken,
  getNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  reportFallAlert,
  reportInactivityAlert,
} from './notificationController';
import { authenticate, authorizeRoles } from '../../middleware/authMiddleware';
import { UserRole } from 'moveplus-shared';

const router = express.Router();

// Push token management
router.post('/register-token', authenticate, registerPushToken);
router.delete('/remove-token', authenticate, removePushToken);

// Fall detection alert
router.post('/fall-alert', authenticate, reportFallAlert);

// Inactivity alert
router.post('/inactivity-alert', authenticate, reportInactivityAlert);

// Notification center
router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.patch('/:id/read', authenticate, markNotificationAsRead);
router.patch('/:id/unread', authenticate, markNotificationAsUnread);
router.patch('/mark-all-read', authenticate, markAllNotificationsAsRead);
router.delete('/:id', authenticate, deleteNotification);

export default router;
