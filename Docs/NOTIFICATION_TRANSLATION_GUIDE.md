# Push Notification Translation System

## Overview

The push notification system now supports internationalization (i18n). Instead of sending hardcoded messages, the server sends translation keys that are translated on the client side based on the user's language preference.

## How It Works

### Server Side

The server sends notifications with **translation keys** instead of hardcoded messages:

```typescript
// Instead of this (old way):
notificationService.sendPushNotification(
  pushToken,
  '⚠️ Fall Alert',
  'John has reported a fall. Please check immediately.'
);

// We now do this (new way):
notificationService.sendPushNotification(
  pushToken,
  'notifications.fallAlert.title',  // Translation key
  'notifications.fallAlert.body',   // Translation key
  {
    titleKey: 'notifications.fallAlert.title',
    bodyKey: 'notifications.fallAlert.body',
    params: { elderlyName: 'John' }  // Parameters for interpolation
  }
);
```

### Client Side

The app automatically translates notifications based on:
1. The user's device language setting (Portuguese or English)
2. The translation keys and parameters in the notification payload
3. The i18next translation system

## Translation Files

### English (`APP/src/localization/resources/en.json`)

```json
{
  "notifications": {
    "fallAlert": {
      "title": "Fall Alert",
      "body": "{{elderlyName}} has reported a fall occurrence. Please check immediately."
    },
    "dataAccessRequest": {
      "title": "Data Access Request",
      "body": "Dr. {{clinicianUsername}} has requested access to your health data. Please review and respond."
    }
  }
}
```

### Portuguese (`APP/src/localization/resources/pt.json`)

```json
{
  "notifications": {
    "fallAlert": {
      "title": "Alerta de Queda",
      "body": "{{elderlyName}} reportou uma ocorrência de queda. Por favor, verifique imediatamente."
    },
    "dataAccessRequest": {
      "title": "Pedido de Acesso a Dados",
      "body": "Dr. {{clinicianUsername}} solicitou acesso aos seus dados de saúde. Por favor, reveja e responda."
    }
  }
}
```

## Implementation Details

### Server-Side Changes

#### Fall Occurrence Notification
**File:** `server/src/modules/fallOccurrence/fallOccurrenceController.ts`

```typescript
const tickets = await notificationService.sendPushNotifications(
  pushTokens,
  'notifications.fallAlert.title',
  'notifications.fallAlert.body',
  {
    type: 'fall_occurrence',
    elderlyId,
    fallOccurrenceId,
    screen: 'FallOccurrenceDetail',
    timestamp: new Date().toISOString(),
    // Translation data
    titleKey: 'notifications.fallAlert.title',
    bodyKey: 'notifications.fallAlert.body',
    params: {
      elderlyName  // Dynamic parameter
    }
  }
);
```

#### Data Access Request Notification
**File:** `server/src/modules/dataAccessRequest/dataAccessRequestController.ts`

```typescript
const ticket = await notificationService.sendPushNotification(
  elderlyPushToken,
  'notifications.dataAccessRequest.title',
  'notifications.dataAccessRequest.body',
  {
    type: 'data_access_request',
    requestId,
    screen: 'DataAccessRequests',
    timestamp: new Date().toISOString(),
    // Translation data
    titleKey: 'notifications.dataAccessRequest.title',
    bodyKey: 'notifications.dataAccessRequest.body',
    params: {
      clinicianUsername  // Dynamic parameter
    }
  }
);
```

### Client-Side Changes

#### Translation Service
**File:** `APP/src/utils/notificationTranslation.ts`

Helper functions to translate notification content:

```typescript
// Translates notification based on keys and params
translateNotification(titleKey, bodyKey, params)

// Extracts translation data from notification payload
getNotificationTranslationData(notification)
```

#### Notification Service
**File:** `APP/src/services/notificationService.ts`

The notification handler now automatically translates notifications when they are received:

```typescript
setNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Extract translation keys
      const { titleKey, bodyKey, params } = getNotificationTranslationData(notification);
      
      // Translate if keys are present
      if (titleKey || bodyKey) {
        const { title, body } = translateNotification(
          titleKey, bodyKey, params,
          fallbackTitle, fallbackBody
        );
        
        // Update notification with translated text
        notification.request.content.title = title;
        notification.request.content.body = body;
      }
      
      return { shouldShowAlert: true, ... };
    },
  });
}
```

## Adding New Notification Types

To add a new translatable notification:

### 1. Add translations to both language files

**en.json:**
```json
{
  "notifications": {
    "newNotification": {
      "title": "New Notification",
      "body": "This is a new notification for {{userName}}"
    }
  }
}
```

**pt.json:**
```json
{
  "notifications": {
    "newNotification": {
      "title": "Nova Notificação",
      "body": "Esta é uma nova notificação para {{userName}}"
    }
  }
}
```

### 2. Send notification from server with translation keys

```typescript
await notificationService.sendPushNotification(
  userPushToken,
  'notifications.newNotification.title',
  'notifications.newNotification.body',
  {
    type: 'new_notification',
    // Other data...
    titleKey: 'notifications.newNotification.title',
    bodyKey: 'notifications.newNotification.body',
    params: {
      userName: 'John Doe'
    }
  }
);
```

### 3. The app automatically handles translation

No additional client-side code needed! The notification handler automatically translates based on the user's language.

## Parameter Interpolation

Use `{{paramName}}` syntax in translation strings for dynamic values:

**Translation:**
```json
"body": "{{userName}} has {{count}} new messages"
```

**Server code:**
```typescript
params: {
  userName: 'John',
  count: 5
}
```

**Result (English):** "John has 5 new messages"  
**Result (Portuguese):** "John tem 5 novas mensagens"

## Language Detection

The app automatically detects the user's device language:
- If device is set to Portuguese → Portuguese notifications
- If device is set to English → English notifications
- If device language not supported → English (fallback)

Users can also manually change the language in app settings (if implemented).

## Testing

### Test English Notifications

1. Set device language to English
2. Trigger a notification (fall occurrence or data access request)
3. Verify notification appears in English

### Test Portuguese Notifications

1. Set device language to Portuguese
2. Trigger a notification
3. Verify notification appears in Portuguese

### Test Parameter Interpolation

1. Create a fall occurrence for an elderly user named "João Silva"
2. Verify the notification shows: "João Silva reportou uma ocorrência de queda..." (PT) or "João Silva has reported a fall occurrence..." (EN)

## Benefits

✅ **Multilingual Support:** Easy to add new languages  
✅ **Centralized Translations:** All translations in JSON files  
✅ **Dynamic Content:** Parameter interpolation for personalized messages  
✅ **Automatic Detection:** Uses device language automatically  
✅ **Maintainable:** Easy to update translations without changing code  
✅ **Consistent:** Same translation system as the rest of the app  

## Current Supported Languages

- 🇬🇧 English (en)
- 🇵🇹 Portuguese (pt)

## Notification Payload Structure

```json
{
  "title": "notifications.fallAlert.title",
  "body": "notifications.fallAlert.body",
  "data": {
    "type": "fall_occurrence",
    "elderlyId": 123,
    "fallOccurrenceId": 456,
    "screen": "FallOccurrenceDetail",
    "timestamp": "2025-10-31T12:00:00Z",
    "titleKey": "notifications.fallAlert.title",
    "bodyKey": "notifications.fallAlert.body",
    "params": {
      "elderlyName": "João Silva"
    }
  }
}
```

## Troubleshooting

### Notification appears with translation key instead of translated text

**Problem:** User sees "notifications.fallAlert.title" instead of "Fall Alert"  
**Solution:** 
- Check that translation key exists in both en.json and pt.json
- Verify i18next is initialized before notification is received
- Check console logs for translation errors

### Wrong language displayed

**Problem:** User device is in Portuguese but receives English notifications  
**Solution:**
- Check device language settings
- Verify i18next is detecting language correctly (check app logs)
- Ensure fallback language is set correctly

### Parameters not replaced

**Problem:** User sees "{{elderlyName}} has reported..." instead of "John has reported..."  
**Solution:**
- Verify params object is being sent from server
- Check param names match exactly (case-sensitive)
- Ensure i18next interpolation is enabled

## Future Enhancements

- Add more languages (Spanish, French, etc.)
- Rich text formatting in notifications
- Different notification templates based on severity
- User preference for notification language (override device language)
- A/B testing for notification content

---

**Last Updated:** October 31, 2025  
**Status:** ✅ Implemented and Ready for Testing
