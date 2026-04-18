import i18n from 'i18next';
import type { NotificationData } from 'moveplus-shared';

/**
 * Translates notification content based on translation keys
 * Used to translate notifications that arrive with translation keys instead of hardcoded text
 */
export function translateNotification(
  titleKey: string | undefined,
  bodyKey: string | undefined,
  params: Record<string, any> = {},
  fallbackTitle?: string,
  fallbackBody?: string
): { title: string; body: string } {
  const title = titleKey
    ? String(i18n.t(titleKey, params))
    : (fallbackTitle || '');

  const body = bodyKey
    ? String(i18n.t(bodyKey, params))
    : (fallbackBody || '');

  return { title, body };
}

/**
 * Extract translation data from notification payload
 */
export function getNotificationTranslationData(notification: any): {
  titleKey?: string;
  bodyKey?: string;
  params?: Record<string, any>;
} {
  const data: NotificationData | undefined = notification?.request?.content?.data || notification?.data;
  const content = notification?.request?.content;

  if (data && (data as any).translated) {
    console.log('[NotificationTranslation] Notification already translated, skipping');
    return { params: {} };
  }

  console.log('[NotificationTranslation] Checking notification:', {
    hasData: !!data,
    hasContent: !!content,
    contentTitle: content?.title,
    contentBody: content?.body,
    dataTitleKey: data?.titleKey,
    dataBodyKey: data?.bodyKey,
    dataParams: data?.params,
  });

  let titleKey = data?.titleKey;
  let bodyKey = data?.bodyKey;

  if (!titleKey && content?.title && content.title.startsWith('notifications.')) {
    console.log('[NotificationTranslation] Found titleKey in content.title:', content.title);
    titleKey = content.title;
  }
  if (!bodyKey && content?.body && content.body.startsWith('notifications.')) {
    console.log('[NotificationTranslation] Found bodyKey in content.body:', content.body);
    bodyKey = content.body;
  }

  return {
    titleKey,
    bodyKey,
    params: data?.params || {},
  };
}
