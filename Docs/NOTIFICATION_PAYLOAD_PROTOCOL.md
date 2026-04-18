# Push Notification Payload Protocol

This document describes the standardized notification payload protocol used across the MovePlus application (both server and client).

## Overview

All notification payloads are defined in the `moveplus-shared` package to ensure type safety and consistency between the server and client applications.

**Location**: `shared/src/models/notifications.ts`

## Base Notification Structure

All notifications extend the base `NotificationData` interface:

```typescript
interface NotificationData {
  type: string;              // Type identifier for routing
  timestamp: string;         // ISO timestamp
  screen?: string;           // Screen to navigate to when tapped
  titleKey?: string;         // i18n translation key for title
  bodyKey?: string;          // i18n translation key for body
  params?: Record<string, any>; // Parameters for translation interpolation
}
```

## Notification Types

### 1. Fall Occurrence Notification

**Type**: `fall_occurrence`

**Purpose**: Notify caregivers and admins when an elderly person reports a fall.

**Interface**:
```typescript
interface FallOccurrenceNotificationData extends NotificationData {
  type: 'fall_occurrence';
  elderlyId: number;
  fallOccurrenceId: number;
  params: {
    elderlyName: string;
  };
}
```

**Translation Keys**:
- Title: `notifications.fallAlert.title`
- Body: `notifications.fallAlert.body`

**Example Payload**:
```json
{
  "type": "fall_occurrence",
  "elderlyId": 123,
  "fallOccurrenceId": 456,
  "screen": "FallOccurrenceDetail",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "titleKey": "notifications.fallAlert.title",
  "bodyKey": "notifications.fallAlert.body",
  "params": {
    "elderlyName": "John Doe"
  }
}
```

### 2. Data Access Request Notification

**Type**: `data_access_request`

**Purpose**: Notify elderly users when a clinician requests access to their data.

**Interface**:
```typescript
interface DataAccessRequestNotificationData extends NotificationData {
  type: 'data_access_request';
  requestId: number;
  params: {
    clinicianUsername: string;
  };
}
```

**Translation Keys**:
- Title: `notifications.dataAccessRequest.title`
- Body: `notifications.dataAccessRequest.body`

**Example Payload**:
```json
{
  "type": "data_access_request",
  "requestId": 789,
  "screen": "DataAccessRequests",
  "timestamp": "2024-01-15T11:00:00.000Z",
  "titleKey": "notifications.dataAccessRequest.title",
  "bodyKey": "notifications.dataAccessRequest.body",
  "params": {
    "clinicianUsername": "Dr. Smith"
  }
}
```

## Notification Constants

The shared package provides constants to avoid magic strings:

### NotificationType
```typescript
const NotificationType = {
  FALL_OCCURRENCE: 'fall_occurrence',
  DATA_ACCESS_REQUEST: 'data_access_request',
} as const;
```

### NotificationKeys
```typescript
const NotificationKeys = {
  fallAlert: {
    titleKey: 'notifications.fallAlert.title',
    bodyKey: 'notifications.fallAlert.body',
  },
  dataAccessRequest: {
    titleKey: 'notifications.dataAccessRequest.title',
    bodyKey: 'notifications.dataAccessRequest.body',
  },
} as const;
```

## Usage Examples

### Server-Side (Sending Notifications)

```typescript
import { 
  FallOccurrenceNotificationData, 
  NotificationKeys, 
  NotificationType 
} from 'moveplus-shared';
import notificationService from '@/services/notificationService';

// Create typed notification data
const notificationData: FallOccurrenceNotificationData = {
  type: NotificationType.FALL_OCCURRENCE,
  elderlyId: 123,
  fallOccurrenceId: 456,
  screen: 'FallOccurrenceDetail',
  timestamp: new Date().toISOString(),
  titleKey: NotificationKeys.fallAlert.titleKey,
  bodyKey: NotificationKeys.fallAlert.bodyKey,
  params: {
    elderlyName: 'John Doe'
  }
};

// Send notification
await notificationService.sendPushNotification(
  userPushToken,
  NotificationKeys.fallAlert.titleKey,
  NotificationKeys.fallAlert.bodyKey,
  notificationData
);
```

### Client-Side (Receiving Notifications)

```typescript
import type { NotificationData } from 'moveplus-shared';
import { translateNotification, getNotificationTranslationData } from '@/utils/notificationTranslation';

// In notification handler
const data = notification.request.content.data as NotificationData | undefined;

if (data) {
  // Get translation data
  const { titleKey, bodyKey, params } = getNotificationTranslationData(notification);
  
  // Translate to current language
  const { title, body } = translateNotification(titleKey, bodyKey, params);
  
  // Navigate based on type
  if (data.screen) {
    navigation.navigate(data.screen, { 
      fallOccurrenceId: data.fallOccurrenceId,
      // other params...
    });
  }
}
```

## Translation System

Notifications use translation keys instead of hardcoded text to support multiple languages.

### Translation Files

**English** (`APP/src/localization/resources/en.json`):
```json
{
  "notifications": {
    "fallAlert": {
      "title": "Fall Alert",
      "body": "{{elderlyName}} has reported a fall. Please check on them immediately."
    },
    "dataAccessRequest": {
      "title": "Data Access Request",
      "body": "Dr. {{clinicianUsername}} is requesting access to your health data."
    }
  }
}
```

**Portuguese** (`APP/src/localization/resources/pt.json`):
```json
{
  "notifications": {
    "fallAlert": {
      "title": "Alerta de Queda",
      "body": "{{elderlyName}} reportou uma queda. Por favor, verifique imediatamente."
    },
    "dataAccessRequest": {
      "title": "Pedido de Acesso a Dados",
      "body": "Dr. {{clinicianUsername}} está solicitando acesso aos seus dados de saúde."
    }
  }
}
```

### How Translation Works

1. **Server sends translation keys**: The server includes `titleKey`, `bodyKey`, and `params` in the notification payload
2. **Client translates**: The client app uses i18next to translate the keys based on the device's language setting
3. **Parameters interpolation**: The `params` object contains values that are interpolated into the translated strings

## Adding New Notification Types

To add a new notification type:

1. **Define the interface** in `shared/src/models/notifications.ts`:
   ```typescript
   export interface NewNotificationData extends NotificationData {
     type: 'new_notification_type';
     // Add specific fields
   }
   ```

2. **Add to union type**:
   ```typescript
   export type AnyNotificationData =
     | FallOccurrenceNotificationData
     | DataAccessRequestNotificationData
     | NewNotificationData;
   ```

3. **Add constants**:
   ```typescript
   export const NewNotificationKeys = {
     titleKey: 'notifications.newNotification.title',
     bodyKey: 'notifications.newNotification.body',
   } as const;
   
   // Update NotificationKeys
   export const NotificationKeys = {
     fallAlert: FallAlertNotificationKeys,
     dataAccessRequest: DataAccessRequestNotificationKeys,
     newNotification: NewNotificationKeys,
   } as const;
   
   // Update NotificationType
   export const NotificationType = {
     FALL_OCCURRENCE: 'fall_occurrence',
     DATA_ACCESS_REQUEST: 'data_access_request',
     NEW_NOTIFICATION: 'new_notification_type',
   } as const;
   ```

4. **Rebuild shared package**:
   ```bash
   cd shared && npm run build
   ```

5. **Add translations** to `APP/src/localization/resources/en.json` and `pt.json`:
   ```json
   {
     "notifications": {
       "newNotification": {
         "title": "New Notification",
         "body": "Notification body with {{param}}"
       }
     }
   }
   ```

6. **Use in server code**:
   ```typescript
   import { NewNotificationData, NotificationKeys, NotificationType } from 'moveplus-shared';
   
   const data: NewNotificationData = {
     type: NotificationType.NEW_NOTIFICATION,
     // ... other fields
   };
   ```

## Benefits of This Approach

1. **Type Safety**: TypeScript ensures correct payload structure across client and server
2. **Consistency**: Single source of truth for notification structure
3. **Maintainability**: Changes to notification types are reflected everywhere
4. **Internationalization**: Built-in support for multiple languages
5. **Refactoring Support**: Renaming or changing types is detected at compile time
6. **Auto-completion**: IDEs provide full autocomplete for notification fields
7. **Documentation**: Types serve as living documentation
