import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushErrorReceipt } from 'expo-server-sdk';
import type { NotificationData } from 'moveplus-shared';

class NotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  /**
   * Validates if a token is a valid Expo push token
   */
  isValidPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }

  /**
   * Send a push notification to a single device
   */
  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<ExpoPushTicket | null> {
    if (!this.isValidPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return null;
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: (data || {}) as Record<string, unknown>,
    };

    try {
      const ticketChunk = await this.expo.sendPushNotificationsAsync([message]);
      return ticketChunk[0];
    } catch (error) {
      console.error('Error sending push notification:', error);
      return null;
    }
  }

  /**
   * Send push notifications to multiple devices
   */
  async sendPushNotifications(
    pushTokens: string[],
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<ExpoPushTicket[]> {
    const validTokens = pushTokens.filter((token) => this.isValidPushToken(token));

    if (validTokens.length === 0) {
      console.error('No valid push tokens provided');
      return [];
    }

    const messages: ExpoPushMessage[] = validTokens.map((pushToken) => ({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: (data || {}) as Record<string, unknown>,
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    try {
      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }

    return tickets;
  }

  /**
   * Send a notification with custom options
   */
  async sendCustomNotification(
    pushToken: string,
    options: Partial<ExpoPushMessage>
  ): Promise<ExpoPushTicket | null> {
    if (!this.isValidPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return null;
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      ...options,
    };

    try {
      const ticketChunk = await this.expo.sendPushNotificationsAsync([message]);
      return ticketChunk[0];
    } catch (error) {
      console.error('Error sending custom push notification:', error);
      return null;
    }
  }

  /**
   * Check the status of sent notifications using their receipt IDs
   * This should be called periodically to verify delivery
   */
  async checkNotificationReceipts(receiptIds: string[]): Promise<void> {
    const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);

        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];

          if (receipt.status === 'ok') {
            continue;
          } else if (receipt.status === 'error') {
            const errorReceipt = receipt as ExpoPushErrorReceipt;
            console.error(`There was an error sending a notification: ${errorReceipt.message}`);

            if (errorReceipt.details && errorReceipt.details.error) {
              console.error(`The error code is ${errorReceipt.details.error}`);

              if (errorReceipt.details.error === 'DeviceNotRegistered') {
                console.log('Device token should be removed from database');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking notification receipts:', error);
      }
    }
  }
}

export default new NotificationService();
