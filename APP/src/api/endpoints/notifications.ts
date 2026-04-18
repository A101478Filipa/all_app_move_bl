import { api } from '@src/services/ApiService';
import { ApiResponse } from '@src/types/api';
import { ApiEmptyResponse } from 'moveplus-shared';

export interface RegisterPushTokenRequest {
  pushToken: string;
}

export interface SendNotificationRequest {
  targetUserId: number;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface BroadcastNotificationRequest {
  userIds: number[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  data: any;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface GetNotificationsParams {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export const notificationApi = {
  registerPushToken: (data: RegisterPushTokenRequest): Promise<ApiResponse<{ pushToken: string }>> =>
    api.post('/notifications/register-token', data).then(response => response.data),

  removePushToken: (): Promise<ApiEmptyResponse> =>
    api.delete('/notifications/remove-token').then(response => response.data),

  getNotifications: (params?: GetNotificationsParams): Promise<ApiResponse<GetNotificationsResponse>> =>
    api.get('/notifications', { params }).then(response => response.data),

  getUnreadCount: (): Promise<ApiResponse<{ count: number }>> =>
    api.get('/notifications/unread-count').then(response => response.data),

  markAsRead: (id: number): Promise<ApiResponse<Notification>> =>
    api.patch(`/notifications/${id}/read`).then(response => response.data),

  markAsUnread: (id: number): Promise<ApiResponse<Notification>> =>
    api.patch(`/notifications/${id}/unread`).then(response => response.data),

  markAllAsRead: (): Promise<ApiEmptyResponse> =>
    api.patch('/notifications/mark-all-read').then(response => response.data),

  deleteNotification: (id: number): Promise<ApiEmptyResponse> =>
    api.delete(`/notifications/${id}`).then(response => response.data),
};
