import prisma from '../prisma';
import notificationService from '../services/notificationService';
import {
  FallOccurrenceNotificationData,
  DataAccessRequestNotificationData,
  SosOccurrenceNotificationData,
  NotificationKeys,
  NotificationType,
} from 'moveplus-shared';
import { getTranslation } from '../localization/translation';

/**
 * Send push notifications when a fall occurrence is created
 * Notifies all caregivers and institution admins in the elderly's institution
 */
export async function sendFallOccurrenceNotifications(
  elderlyId: number,
  elderlyName: string,
  fallOccurrenceId: number
) {
  try {
    const elderly = await prisma.elderly.findUnique({
      where: { id: elderlyId },
      include: {
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
      },
    });

    if (!elderly?.institution) {
      console.log('Elderly has no institution, skipping notifications');
      return;
    }

    const pushTokens: string[] = [];
    const userIdsToNotify: number[] = [];

    elderly.institution.caregivers.forEach((caregiver) => {
      userIdsToNotify.push(caregiver.user.id);
      if (caregiver.user.pushToken) {
        pushTokens.push(caregiver.user.pushToken);
      }
    });

    elderly.institution.admins.forEach((admin) => {
      userIdsToNotify.push(admin.user.id);
      if (admin.user.pushToken) {
        pushTokens.push(admin.user.pushToken);
      }
    });

    // Idioma fixo para já
    const userLang = 'pt';

    // Gerar as mensagens dinamicamente com as traduções
    const title = getTranslation(userLang, 'fallAlertTitle');
    const body = getTranslation(userLang, 'fallAlertBody', { elderlyName });

    const notificationData: FallOccurrenceNotificationData = {
      type: NotificationType.FALL_OCCURRENCE,
      elderlyId,
      fallOccurrenceId,
      screen: 'FallOccurrenceDetail',
      timestamp: new Date().toISOString(),
      titleKey: NotificationKeys.fallAlert.titleKey,
      bodyKey: NotificationKeys.fallAlert.bodyKey,
      params: {
        elderlyName,
      },
    };

    // 1. Guardar a notificação na Base de Dados
    const dbNotifications = userIdsToNotify.map(userId => ({
      userId,
      type: NotificationType.FALL_OCCURRENCE,
      title: title, 
      body: body,   
      data: notificationData as any,
    }));

    if (dbNotifications.length > 0) {
      await prisma.notification.createMany({
        data: dbNotifications
      });
    }

    // 2. Enviar a Push Notification (o que faltava no teu código original)
    let ticketCount = 0;
    
    if (pushTokens.length > 0) {
      for (const token of pushTokens) {
        if (notificationService.isValidPushToken(token)) {
          const ticket = await notificationService.sendPushNotification(
            token,
            title, 
            body,  
            notificationData
          );
          if (ticket) {
            ticketCount++;
          }
        }
      }
    }

    console.log(
      `Fall occurrence notification: saved to ${userIdsToNotify.length} notification centers, sent push to ${pushTokens.length} logged-in users (${ticketCount} successful)`
    );
  } catch (error) {
    console.error('Error sending fall occurrence notifications:', error);
    throw error;
  }
}

/**
 * Send push notification when a clinician requests data access
 * Notifies the elderly user about the access request
 */
export async function sendDataAccessRequestNotification(
  elderlyUserId: number,
  elderlyPushToken: string | null,
  clinicianUsername: string,
  requestId: number
) {
  const notificationData: DataAccessRequestNotificationData = {
    type: NotificationType.DATA_ACCESS_REQUEST,
    requestId,
    screen: 'DataAccessRequests',
    timestamp: new Date().toISOString(),
    titleKey: NotificationKeys.dataAccessRequest.titleKey,
    bodyKey: NotificationKeys.dataAccessRequest.bodyKey,
    params: {
      clinicianUsername,
    },
  };

  // Always save notification to database for notification center
  await prisma.notification.create({
    data: {
      userId: elderlyUserId,
      type: NotificationType.DATA_ACCESS_REQUEST,
      title: NotificationKeys.dataAccessRequest.titleKey,
      body: NotificationKeys.dataAccessRequest.bodyKey,
      data: notificationData as any,
    },
  });

  // Only send push notification if user has a valid push token
  if (!elderlyPushToken) {
    console.log('Elderly user has no push token, notification saved to database only');
    return;
  }

  if (!notificationService.isValidPushToken(elderlyPushToken)) {
    console.log('Invalid push token for elderly user, notification saved to database only');
    return;
  }

  try {
    const ticket = await notificationService.sendPushNotification(
      elderlyPushToken,
      NotificationKeys.dataAccessRequest.titleKey,
      NotificationKeys.dataAccessRequest.bodyKey,
      notificationData
    );

    if (ticket) {
      console.log(`Data access request notification sent successfully to elderly user`);
    } else {
      console.log('Failed to send push notification, but notification saved to database');
    }
  } catch (error) {
    console.error('Error sending data access request notification:', error);
    // Don't throw - notification is already saved to database
  }
}


/**
 * Send push notifications when an SOS occurrence is created
 * Notifies all caregivers and institution admins in the elderly's institution
*/

export async function sendSosOccurrenceNotifications(
  elderlyId: number,
  elderlyName: string,
  sosOccurrenceId: number
) {

  try {
    const elderly = await prisma.elderly.findUnique({
      where: { id: elderlyId },
      include: {
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
      },
    });

    if (!elderly?.institution) {
      console.log('Elderly has no institution, skipping SOS notifications');
      return;
    }

    const pushTokens: string[] = [];
    const userIdsToNotify: number[] = [];

    elderly.institution.caregivers.forEach((caregiver) => {
      userIdsToNotify.push(caregiver.user.id);
      if (caregiver.user.pushToken) pushTokens.push(caregiver.user.pushToken);
    });

    elderly.institution.admins.forEach((admin) => {
      userIdsToNotify.push(admin.user.id);
      if (admin.user.pushToken) pushTokens.push(admin.user.pushToken);
    });

    const userLang = 'pt';
    const title = getTranslation(userLang, 'sosAlertTitle');
    const body = getTranslation(userLang, 'sosAlertBody', { elderlyName });

    const notificationData: SosOccurrenceNotificationData = {
      type: NotificationType.SOS_OCCURRENCE,
      elderlyId,
      sosOccurrenceId,
      screen: 'SosOccurrenceScreen',
      timestamp: new Date().toISOString(),
      titleKey: NotificationKeys.sosAlert.titleKey,
      bodyKey: NotificationKeys.sosAlert.bodyKey,
      params: { elderlyName },
    };

    const dbNotifications = userIdsToNotify.map((userId) => ({
      userId,
      type: NotificationType.SOS_OCCURRENCE,
      title,
      body,
      data: notificationData as any,
    }));


    if (dbNotifications.length > 0) {
      await prisma.notification.createMany({ data: dbNotifications });
    }

    let ticketCount = 0;

    for (const token of pushTokens) {
      if (notificationService.isValidPushToken(token)) {
        const ticket = await notificationService.sendPushNotification(token, title, body, notificationData);
        if (ticket) ticketCount++;
      }
    }

    console.log(
      `SOS notification: saved to ${userIdsToNotify.length} notification centers, sent push to ${pushTokens.length} users (${ticketCount} successful)`
    );

  } catch (error) {
    console.error('Error sending SOS occurrence notifications:', error);
    throw error;
  }
}


