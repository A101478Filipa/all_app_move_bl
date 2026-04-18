import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import notificationService from '@src/services/notificationService';
import { notificationApi } from '@src/api/endpoints/notifications';
import { useAuthStore } from '@stores/authStore';
import type { NotificationData, FallOccurrenceNotificationData, SosOccurrenceNotificationData } from 'moveplus-shared';
import { NotificationType } from 'moveplus-shared';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '@src/services/NavigationService';

interface NotificationContextType {
  expoPushToken: string | undefined;
  notification: Notifications.Notification | undefined;
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  registerForPushNotifications: () => Promise<void>;
  unregisterPushNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const { user } = useAuthStore();

  const handleNotificationNavigation = useCallback((data: NotificationData | undefined) => {
    if (!data?.type) return;

    if (data.type === NotificationType.FALL_OCCURRENCE) {
      const fallData = data as unknown as FallOccurrenceNotificationData;

      if (navigationRef.isReady()) {
        navigationRef.dispatch(
          CommonActions.navigate({
            name: 'InstitutionDashboardTab',
            params: {
              screen: 'FallOccurrenceScreen',
              params: { occurrenceId: fallData.fallOccurrenceId },
            },
          })
        );
      }
    }

    if (data.type === NotificationType.SOS_OCCURRENCE) {
      const sosData = data as unknown as SosOccurrenceNotificationData;

      if (navigationRef.isReady()) {
        navigationRef.dispatch(
          CommonActions.navigate({
            name: 'InstitutionDashboardTab',
            params: {
              screen: 'SosOccurrenceScreen',
              params: { occurrenceId: sosData.sosOccurrenceId },
            },
          })
        );
      }
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await notificationApi.getUnreadCount();
      if (response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [user]);

  useEffect(() => {
    notificationService.setNotificationHandler();

    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        setNotification(notification);
        setUnreadCount((prev) => prev + 1);
      }
    );

    responseListener.current = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        const data = response.notification.request.content.data as unknown as NotificationData | undefined;
        handleNotificationNavigation(data);
      }
    );

    // Tratar o caso de cold start (app estava completamente fechada)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data as unknown as NotificationData | undefined;
        handleNotificationNavigation(data);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      if (!expoPushToken) {
        registerForPushNotifications();
      }
      refreshUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [user, expoPushToken, refreshUnreadCount]);

  const registerForPushNotifications = async () => {
    try {
      const token = await notificationService.registerForPushNotificationsAsync();

      if (token) {
        console.log('Push token obtained:', token);
        setExpoPushToken(token);

        try {
          await notificationApi.registerPushToken({ pushToken: token });
          console.log('Push token registered with server');
        } catch (error) {
          console.error('Failed to register push token with server:', error);
        }
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const unregisterPushNotifications = async () => {
    try {
      await notificationApi.removePushToken();
      setExpoPushToken(undefined);
      console.log('Push token removed from server');
    } catch (error) {
      console.error('Failed to remove push token from server:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        unreadCount,
        refreshUnreadCount,
        registerForPushNotifications,
        unregisterPushNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
