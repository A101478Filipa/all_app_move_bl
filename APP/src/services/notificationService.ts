import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import i18n from 'i18next';
import { translateNotification, getNotificationTranslationData } from '@src/utils/notificationTranslation';

class NotificationService {
  /**
   * Request notification permissions and get push token
   */
  async registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token: string | undefined;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const existingPermissions = await Notifications.getPermissionsAsync();

      let isGranted = Platform.OS === 'ios'
        ? existingPermissions.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
        : existingPermissions.android?.importance !== undefined && existingPermissions.android.importance > 0;

      if (!isGranted) {
        const permissions = await Notifications.requestPermissionsAsync();
        isGranted = Platform.OS === 'ios'
          ? permissions.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
          : permissions.android?.importance !== undefined && permissions.android.importance > 0;
      }

      if (!isGranted) {
        console.log('Failed to get push token for push notification!');
        return;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

        if (!projectId) {
          console.warn('Project ID not found - push notifications require EAS project setup. Run "npx eas init" to configure.');
          return;
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;

        console.log('Push token:', token);
      } catch (e) {
        console.error('Error getting push token:', e);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  /**
   * Configure notification behavior when app is in foreground
   * Handles translation of notification content based on translation keys
   */
  setNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('[NotificationService] Received notification:', {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        });

        const { titleKey, bodyKey, params } = getNotificationTranslationData(notification);

        console.log('[NotificationService] Extracted translation data:', {
          titleKey,
          bodyKey,
          params,
        });

        if (titleKey || bodyKey) {
          const { title, body } = translateNotification(
            titleKey,
            bodyKey,
            params,
            notification.request.content.title || undefined,
            notification.request.content.body || undefined
          );

          console.log('[NotificationService] Translated notification:', { title, body });

          const notificationData = { ...(notification.request.content.data as any) };
          delete notificationData.titleKey;
          delete notificationData.bodyKey;
          notificationData.translated = true;

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: notificationData,
              sound: true,
            },
            trigger: null,
          });

          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: true,
            shouldShowBanner: false,
            shouldShowList: false,
          };
        }

        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  }

  /**
   * Add listener for notifications received while app is foregrounded
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add listener for when a notification is tapped/interacted with
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Get the last notification response (useful for deep linking when app was closed)
   */
  async getLastNotificationResponseAsync() {
    return await Notifications.getLastNotificationResponseAsync();
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: trigger || null, // null means send immediately
    });
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Dismiss all notifications
   */
  async dismissAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Get notification permissions status
   */
  async getPermissionsAsync() {
    return await Notifications.getPermissionsAsync();
  }

  /**
   * Set badge count (iOS)
   */
  async setBadgeCountAsync(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Get badge count (iOS)
   */
  async getBadgeCountAsync() {
    return await Notifications.getBadgeCountAsync();
  }
}

export default new NotificationService();
