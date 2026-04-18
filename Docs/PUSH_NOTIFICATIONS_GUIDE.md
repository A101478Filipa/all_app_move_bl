# Push Notifications Implementation Guide

This guide covers the complete push notification implementation for the Move Plus React Native Expo app with Node.js TypeScript server.

## Overview

The implementation uses:
- **Expo Push Notifications** for the mobile app
- **Expo Server SDK** for the Node.js backend
- **PostgreSQL** database to store push tokens

## Features Implemented

### Server-Side (Node.js + TypeScript)

1. **Database Schema**
   - Added `pushToken` field to User model in Prisma schema
   - Migration created and applied

2. **Notification Service** (`server/src/services/notificationService.ts`)
   - Send single notifications
   - Send batch notifications
   - Validate push tokens
   - Check notification receipts
   - Custom notification options

3. **API Endpoints** (`server/src/modules/notifications/`)
   - `POST /api/notifications/register-token` - Register/update push token
   - `DELETE /api/notifications/remove-token` - Remove push token
   - `POST /api/notifications/test` - Send test notification
   - `POST /api/notifications/send` - Send to specific user (clinicians, admins)
   - `POST /api/notifications/broadcast` - Broadcast to multiple users (admins only)

### Client-Side (React Native + Expo)

1. **Notification Service** (`APP/src/services/notificationService.ts`)
   - Request permissions
   - Get Expo push token
   - Handle foreground/background notifications
   - Schedule local notifications
   - Manage badge counts

2. **API Integration** (`APP/src/api/endpoints/notifications.ts`)
   - Register push token with server
   - Remove push token
   - Send test notifications

3. **Notification Provider** (`APP/src/providers/NotificationProvider.tsx`)
   - Auto-register on login
   - Listen for notifications
   - Handle notification responses
   - Context for accessing notification state

4. **App Integration** (`APP/App.tsx`)
   - NotificationProvider wrapped around app

## Usage

### For Users (Mobile App)

Notifications are automatically registered when a user logs in. The app will:
1. Request notification permissions
2. Get an Expo push token
3. Send the token to the server
4. Listen for incoming notifications

### For Developers

#### Sending a Notification from Server

```typescript
import notificationService from './services/notificationService';

// Send to a single user
const ticket = await notificationService.sendPushNotification(
  userPushToken,
  'Notification Title',
  'Notification body text',
  { customData: 'value' }
);

// Send to multiple users
const tickets = await notificationService.sendPushNotifications(
  [token1, token2, token3],
  'Broadcast Title',
  'Message for all users',
  { type: 'broadcast' }
);
```

#### Using API Endpoints

**Register Push Token:**
```bash
POST /api/notifications/register-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Send Test Notification:**
```bash
POST /api/notifications/test
Authorization: Bearer <token>
```

**Send to Specific User (Clinician/Admin):**
```bash
POST /api/notifications/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetUserId": 123,
  "title": "Appointment Reminder",
  "body": "You have an appointment tomorrow at 10 AM",
  "data": {
    "screen": "Appointments",
    "appointmentId": 456
  }
}
```

**Broadcast Notification (Admin/Programmer):**
```bash
POST /api/notifications/broadcast
Authorization: Bearer <token>
Content-Type: application/json

{
  "userIds": [1, 2, 3, 4, 5],
  "title": "System Maintenance",
  "body": "The system will be under maintenance tonight",
  "data": {
    "type": "maintenance"
  }
}
```

#### Using in React Native Components

```tsx
import { useNotifications } from '@providers/NotificationProvider';

function MyComponent() {
  const { expoPushToken, notification, registerForPushNotifications } = useNotifications();

  return (
    <View>
      <Text>Push Token: {expoPushToken}</Text>
      {notification && (
        <Text>Last notification: {notification.request.content.title}</Text>
      )}
    </View>
  );
}
```

#### Handling Notification Taps

The NotificationProvider automatically handles notification responses. To add custom navigation:

Edit `APP/src/providers/NotificationProvider.tsx`:

```tsx
responseListener.current = notificationService.addNotificationResponseReceivedListener(
  (response) => {
    const data = response.notification.request.content.data;
    
    // Add your navigation logic
    if (data?.screen === 'Appointments') {
      navigation.navigate('Appointments', { id: data.appointmentId });
    }
  }
);
```

## Testing

### Test on Physical Device

Push notifications require a **physical device** (not simulator/emulator).

1. Run the app on a physical device:
   ```bash
   cd APP
   npx expo start
   # Scan QR code with Expo Go app
   ```

2. Login to the app

3. The app should automatically request notification permissions and register the push token

4. Test sending a notification:
   - Use the test endpoint
   - Or use the Expo push notification tool: https://expo.dev/notifications

### Test with Expo Push Notification Tool

1. Get your push token from the app logs
2. Visit: https://expo.dev/notifications
3. Enter your push token
4. Compose a test message
5. Send

## Configuration

### Android Setup (Optional - for Custom Icons/Sounds)

1. Add a notification icon to `APP/assets/notification-icon.png` (96x96px, white with transparent background)
2. Add notification sound to `APP/assets/notification-sound.wav` (optional)

### iOS Setup

No additional configuration needed. Expo handles APNs automatically in development.

For production:
1. Configure your App ID in Apple Developer Portal
2. Enable Push Notifications capability
3. Generate APNs key
4. Add credentials to Expo: `npx eas credentials`

### Android Production Setup

For Firebase Cloud Messaging (production):
1. Create a Firebase project
2. Download `google-services.json`
3. Place in `APP/` directory
4. Build with EAS: `npx eas build --platform android`

## Project ID Configuration

For the notification service to work, you need a project ID. You have two options:

### Option 1: Use Expo Application Services (EAS) - Recommended

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure EAS:
   ```bash
   cd APP
   eas build:configure
   ```

4. This will create an `eas.json` file and automatically link your project

### Option 2: Manual Configuration

If you prefer not to use EAS, update `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

You can generate a UUID for the project ID.

## Permissions

### Required Permissions

**iOS:**
- Automatic permission request on app launch

**Android:**
- Automatically added by expo-notifications plugin
- No runtime permission needed for notifications (Android 13+)

### User Roles & Notification Permissions

- **All users:** Can register/remove their push token, send test notifications
- **Clinicians, Institution Admins, Programmers:** Can send notifications to specific users
- **Institution Admins, Programmers:** Can broadcast to multiple users

## Troubleshooting

### "Must use physical device for Push Notifications"
- Simulators/emulators don't support push notifications
- Use a real iOS or Android device

### "Push token not received"
- Check device notification permissions
- Ensure you're using a physical device
- Check console for errors
- Verify project ID is configured

### "Failed to register push token with server"
- Check that user is authenticated
- Verify server is running
- Check network connection
- Review server logs for errors

### "DeviceNotRegistered" error
- Token is no longer valid
- User may have uninstalled/reinstalled the app
- Token is automatically removed from database by the server

## Database Migration

The migration has already been applied. If you need to revert or check status:

```bash
cd server
npx prisma migrate status
npx prisma migrate reset  # Caution: Resets database
```

## Security Considerations

1. **Token Storage:** Push tokens are stored securely in the database
2. **Authentication:** All endpoints require authentication
3. **Authorization:** Role-based access control for sending notifications
4. **Validation:** Push tokens are validated before sending
5. **Rate Limiting:** Consider adding rate limiting to prevent abuse

## Next Steps

1. **Custom Notification Types:**
   - Create specific notification types (appointments, alerts, messages)
   - Add notification preferences per user
   - Implement notification history

2. **Scheduled Notifications:**
   - Server-side cron jobs for recurring notifications
   - Appointment reminders
   - Medication reminders

3. **Rich Notifications:**
   - Add images to notifications
   - Action buttons
   - Notification categories

4. **Analytics:**
   - Track notification open rates
   - Monitor delivery success
   - User engagement metrics

## Resources

- [Expo Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)
- [Push Notification Best Practices](https://docs.expo.dev/push-notifications/sending-notifications/)
