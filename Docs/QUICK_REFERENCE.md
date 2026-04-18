# Push Notifications - Quick Reference

## 🚀 Quick Start

### Test Notifications Now

1. **Run the app on a physical device:**
   ```bash
   cd APP
   npx expo start
   # Scan QR code with your device
   ```

2. **Login to the app** - Push token auto-registers

3. **Send test notification:**
   - Use the `/api/notifications/test` endpoint
   - Or add the NotificationSettingsExample component to your app

## 📱 Client Usage

### Access Notification State
```tsx
import { useNotifications } from '@providers/NotificationProvider';

function MyComponent() {
  const { expoPushToken, notification } = useNotifications();
  return <Text>Token: {expoPushToken}</Text>;
}
```

### Send Test Notification
```tsx
import { notificationApi } from '@src/api/endpoints/notifications';

await notificationApi.sendTestNotification();
```

## 🖥️ Server Usage

### Send Single Notification
```typescript
import notificationService from './services/notificationService';

await notificationService.sendPushNotification(
  pushToken,
  'Title',
  'Body message',
  { customData: 'value' }
);
```

### Send to Multiple Users
```typescript
await notificationService.sendPushNotifications(
  [token1, token2, token3],
  'Title',
  'Body',
  { data: 'value' }
);
```

### Using Helper Functions
```typescript
import { notifyFallOccurrence } from './utils/notificationHelpers';

await notifyFallOccurrence(elderlyId, fallDetails);
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/register-token` | POST | Register push token |
| `/api/notifications/remove-token` | DELETE | Remove push token |
| `/api/notifications/test` | POST | Send test notification |
| `/api/notifications/send` | POST | Send to user (admin) |
| `/api/notifications/broadcast` | POST | Send to multiple (admin) |

### Example API Call
```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Common Scenarios

### Fall Detection Alert
```typescript
import { notifyFallOccurrence } from './utils/notificationHelpers';
await notifyFallOccurrence(elderlyId, { id: fallId, severity: 'high' });
```

### Medication Reminder
```typescript
import { notifyMedicationReminder } from './utils/notificationHelpers';
await notifyMedicationReminder(elderlyId, 'Aspirin');
```

### System Announcement
```typescript
import { notifySystemMaintenance } from './utils/notificationHelpers';
await notifySystemMaintenance(new Date('2025-11-01'), '2 hours');
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No token received | Use physical device, not simulator |
| Permission denied | Check device notification settings |
| Server error | Verify authentication token is valid |
| DeviceNotRegistered | Token expired, user needs to re-login |

## 📋 Checklist

- [ ] App running on physical device
- [ ] User logged in
- [ ] Push token appears in logs
- [ ] Test notification sent successfully
- [ ] Notification received on device
- [ ] Tapping notification works

## 🎨 UI Component

Add notification settings to your app:
```tsx
import { NotificationSettingsExample } from '@src/components/NotificationSettingsExample';

<NotificationSettingsExample />
```

## 📚 Documentation

- **Full Guide:** `PUSH_NOTIFICATIONS_GUIDE.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **Expo Docs:** https://docs.expo.dev/push-notifications/

## 🔑 Key Files

**Server:**
- `server/src/services/notificationService.ts` - Core service
- `server/src/utils/notificationHelpers.ts` - Helper functions
- `server/src/modules/notifications/` - API endpoints

**Client:**
- `APP/src/services/notificationService.ts` - Client service
- `APP/src/providers/NotificationProvider.tsx` - React provider
- `APP/src/api/endpoints/notifications.ts` - API client

## ⚡ Quick Commands

```bash
# Start app
cd APP && npx expo start

# Start server
cd server && npm run dev

# Check migration status
cd server && npx prisma migrate status

# View server logs
cd server && npm run dev | grep notification
```

---
**Need help?** Check `PUSH_NOTIFICATIONS_GUIDE.md` for detailed documentation.
