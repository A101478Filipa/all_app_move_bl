import prisma from '../prisma';
import notificationService from '../services/notificationService';
import {
  FallOccurrenceNotificationData,
  SosOccurrenceNotificationData,
  TimeOffRequestNotificationData,
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
            clinicians: {
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

    const seenUserIds = new Set<number>();
    const userIdsToNotify: number[] = [];
    const pushTokens: string[] = [];

    const addRecipient = (userId: number, pushToken: string | null) => {
      if (!seenUserIds.has(userId)) {
        seenUserIds.add(userId);
        userIdsToNotify.push(userId);
        if (pushToken) pushTokens.push(pushToken);
      }
    };

    elderly.institution.caregivers.forEach((c) => addRecipient(c.user.id, c.user.pushToken));
    elderly.institution.admins.forEach((a) => addRecipient(a.user.id, a.user.pushToken));
    elderly.institution.clinicians.forEach((cl) => addRecipient(cl.user.id, cl.user.pushToken));

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

    // 2. Enviar a Push Notification
    // Omit titleKey/bodyKey from the push payload — the title/body are already
    // translated by the server, so the client must NOT re-schedule a translated copy.
    const { titleKey: _ftk, bodyKey: _fbk, ...pushData } = notificationData;
    let ticketCount = 0;
    
    if (pushTokens.length > 0) {
      for (const token of pushTokens) {
        if (notificationService.isValidPushToken(token)) {
          const ticket = await notificationService.sendPushNotification(
            token,
            title, 
            body,  
            pushData as any
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
            clinicians: {
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

    const seenUserIds = new Set<number>();
    const userIdsToNotify: number[] = [];
    const pushTokens: string[] = [];

    const addRecipient = (userId: number, pushToken: string | null) => {
      if (!seenUserIds.has(userId)) {
        seenUserIds.add(userId);
        userIdsToNotify.push(userId);
        if (pushToken) pushTokens.push(pushToken);
      }
    };

    elderly.institution.caregivers.forEach((c) => addRecipient(c.user.id, c.user.pushToken));
    elderly.institution.admins.forEach((a) => addRecipient(a.user.id, a.user.pushToken));
    elderly.institution.clinicians.forEach((cl) => addRecipient(cl.user.id, cl.user.pushToken));

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

    // Omit titleKey/bodyKey from the push payload — the title/body are already
    // translated by the server, so the client must NOT re-schedule a translated copy.
    const { titleKey: _stk, bodyKey: _sbk, ...sosPushData } = notificationData;
    let ticketCount = 0;

    for (const token of pushTokens) {
      if (notificationService.isValidPushToken(token)) {
        const ticket = await notificationService.sendPushNotification(token, title, body, sosPushData as any);
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

/**
 * Send push notification to all institution admins when a staff time-off request is submitted
 */
export async function sendTimeOffRequestNotifications(
  requesterId: number,
  timeOffId: number,
  requesterName: string,
  timeOffType: string,
  startDate: Date,
  endDate: Date
) {
  try {
    // Find the institution of the requester (could be caregiver or clinician)
    const requesterUser = await prisma.user.findUnique({
      where: { id: requesterId },
      include: {
        caregiver: { select: { institutionId: true } },
        clinician: { select: { institutionId: true } },
      },
    });

    const institutionId =
      requesterUser?.caregiver?.institutionId ||
      requesterUser?.clinician?.institutionId;

    if (!institutionId) {
      console.log('Requester has no institution, skipping time-off notifications');
      return;
    }

    // Find all admins of that institution
    const admins = await prisma.institutionAdmin.findMany({
      where: { institutionId },
      include: { user: { select: { id: true, pushToken: true } } },
    });

    if (admins.length === 0) return;

    const userLang = 'pt';
    const fmt = (d: Date) => d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const title = getTranslation(userLang, 'timeOffRequestTitle');
    const body = getTranslation(userLang, 'timeOffRequestBody', {
      requesterName,
      timeOffType,
      startDate: fmt(new Date(startDate)),
      endDate: fmt(new Date(endDate)),
    });

    const notificationData: TimeOffRequestNotificationData = {
      type: NotificationType.TIME_OFF_REQUEST,
      timeOffId,
      screen: 'AdminTeamSchedules',
      timestamp: new Date().toISOString(),
      titleKey: NotificationKeys.timeOffRequest.titleKey,
      bodyKey: NotificationKeys.timeOffRequest.bodyKey,
      params: { requesterName, timeOffType, startDate: fmt(new Date(startDate)), endDate: fmt(new Date(endDate)) },
    };

    const dbNotifications = admins.map(a => ({
      userId: a.user.id,
      type: NotificationType.TIME_OFF_REQUEST,
      title,
      body,
      data: notificationData as any,
    }));

    await prisma.notification.createMany({ data: dbNotifications });

    const { titleKey: _tk, bodyKey: _bk, ...pushData } = notificationData;
    let ticketCount = 0;

    for (const admin of admins) {
      const token = admin.user.pushToken;
      if (token && notificationService.isValidPushToken(token)) {
        const ticket = await notificationService.sendPushNotification(token, title, body, pushData as any);
        if (ticket) ticketCount++;
      }
    }

    console.log(
      `Time-off notification: saved to ${admins.length} admin notification centers, push sent to ${ticketCount} admins`
    );
  } catch (error) {
    console.error('Error sending time-off request notifications:', error);
    // Don't throw — notification failure must not block the main request
  }
}


