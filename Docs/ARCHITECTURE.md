# Push Notification Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Native App                        │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    App.tsx                                 │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │           NotificationProvider                       │  │ │
│  │  │                                                      │  │ │
│  │  │  • Auto-registers on login                           │  │ │
│  │  │  • Listens for notifications                         │  │ │
│  │  │  • Handles responses                                 │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              │ Uses                             │
│                              ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │        notificationService.ts (Client)                     │ │
│  │                                                            │ │
│  │  • registerForPushNotificationsAsync()                     │ │
│  │  • Request permissions (iOS/Android)                       │ │
│  │  • Get Expo Push Token                                     │ │
│  │  • Set notification handlers                               │ │
│  │  • Add listeners                                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               │ HTTP Request
                               │ POST /api/notifications/register-token
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Node.js/Express Server                     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              notificationRoutes.ts                         │ │
│  │                                                            │ │
│  │  POST   /register-token   → registerPushToken()            │ │
│  │  DELETE /remove-token     → removePushToken()              │ │
│  │  POST   /test             → sendTestNotification()         │ │
│  │  POST   /send             → sendNotificationToUser()       │ │
│  │  POST   /broadcast        → sendBroadcastNotification()    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              │ Calls                            │
│                              ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          notificationController.ts                         │ │
│  │                                                            │ │
│  │  • Validates input                                         │ │
│  │  • Checks authentication                                   │ │
│  │  • Stores/retrieves tokens from DB                         │ │
│  │  • Calls notificationService                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              │ Uses                             │
│                              ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         notificationService.ts (Server)                    │ │
│  │                                                            │ │
│  │  • sendPushNotification()                                  │ │
│  │  • sendPushNotifications() (batch)                         │ │
│  │  • Validates Expo tokens                                   │ │
│  │  • Chunks messages (max 100)                               │ │
│  │  • Handles errors                                          │ │
│  │  • Checks receipts                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              │ Uses                             │
│                              ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              expo-server-sdk                               │ │
│  │                                                            │ │
│  │  • Expo.sendPushNotificationsAsync()                       │ │
│  │  • Communication with Expo servers                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               │ HTTPS
                               ▼
        ┌──────────────────────────────────────┐
        │         Expo Push Service            │
        │                                      │
        │  • Routes to APNs (iOS)              │
        │  • Routes to FCM (Android)           │
        │  • Handles delivery                  │
        │  • Returns receipts                  │
        └──────────────────────────────────────┘
                               │
                      ┌────────┴────────┐
                      │                 │
                      ▼                 ▼
            ┌─────────────────┐  ┌─────────────────┐
            │      APNs       │  │       FCM       │
            │  (Apple Push    │  │  (Firebase      │
            │  Notification   │  │  Cloud          │
            │   Service)      │  │  Messaging)     │
            └─────────────────┘  └─────────────────┘
                      │                 │
                      └────────┬────────┘
                               ▼
                      ┌─────────────────┐
                      │  User's Device  │
                      │                 │
                      │  Notification!  │
                      └─────────────────┘
```

## Data Flow

### Registration Flow

```
User Login
    │
    ▼
NotificationProvider detects user
    │
    ▼
Request device permissions (iOS/Android)
    │
    ▼
Get Expo Push Token
    │
    ▼
POST /api/notifications/register-token
    │
    ▼
Save token to database (User.pushToken)
    │
    ▼
Ready to receive notifications!
```

### Notification Send Flow

```
Server Event (e.g., fall detected)
    │
    ▼
Call notifyFallOccurrence(elderlyId, details)
    │
    ▼
Query database for relevant users' push tokens
    │
    ▼
Call notificationService.sendPushNotifications()
    │
    ▼
Chunk tokens (max 100 per request)
    │
    ▼
Send to Expo Push Service via expo-server-sdk
    │
    ▼
Expo routes to APNs (iOS) or FCM (Android)
    │
    ▼
Push notification delivered to device
    │
    ▼
User sees notification
    │
    ├─► Tap notification → App opens to specific screen
    │
    └─► Dismiss → No action
```

## Database Schema

```
User Table
├── id: Int (Primary Key)
├── username: String
├── password: String
├── role: UserRole
├── avatarUrl: String?
├── pushToken: String?  ← NEW FIELD
├── createdAt: DateTime
└── updatedAt: DateTime
```

## Key Components

### Client Components

```
APP/
├── App.tsx
│   └── <NotificationProvider>
│
├── src/
    ├── providers/
    │   └── NotificationProvider.tsx
    │       • Context provider
    │       • Auto-registration logic
    │       • Notification listeners
    │
    ├── services/
    │   └── notificationService.ts
    │       • Permission handling
    │       • Token management
    │       • Local notifications
    │
    ├── api/endpoints/
    │   └── notifications.ts
    │       • API client methods
    │       • Type-safe calls
    │
    └── components/
        └── NotificationSettingsExample.tsx
            • UI for settings
            • Toggle notifications
            • Send test
```

### Server Components

```
server/
└── src/
    ├── services/
    │   └── notificationService.ts
    │       • Core sending logic
    │       • Expo SDK integration
    │       • Error handling
    │
    ├── modules/notifications/
    │   ├── notificationController.ts
    │   │   • Endpoint handlers
    │   │   • Business logic
    │   │
    │   └── notificationRoutes.ts
    │       • Express routes
    │       • Middleware
    │
    ├── utils/
    │   └── notificationHelpers.ts
    │       • Pre-built scenarios
    │       • Fall alerts
    │       • Medication reminders
    │       • Appointments
    │
    └── apiRoutes.ts
        • Main router
        • Mounts /notifications routes
```

## Security & Authorization

```
┌─────────────────────────────────────────┐
│         API Request Flow                │
│                                         │
│  Client Request                         │
│       │                                 │
│       ▼                                 │
│  authenticate middleware                │
│       │                                 │
│       ├─ No token → 401 Unauthorized    │
│       │                                 │
│       ├─ Invalid token → 401            │
│       │                                 │
│       ▼                                 │
│  authorizeRoles middleware              │
│       │                                 │
│       ├─ Check user role                │
│       │                                 │
│       ├─ Insufficient role → 403        │
│       │                                 │
│       ▼                                 │
│  Controller function                    │
│       │                                 │
│       ├─ Validate input                 │
│       │                                 │
│       ├─ Check permissions              │
│       │                                 │
│       ▼                                 │
│  Process & Send Notification            │
└─────────────────────────────────────────┘
```

## Role-Based Access

| Action | Elderly | Caregiver | Clinician | Admin | Programmer |
|--------|---------|-----------|-----------|-------|------------|
| Register own token | ✅ | ✅ | ✅ | ✅ | ✅ |
| Remove own token | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send test to self | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send to specific user | ❌ | ❌ | ✅ | ✅ | ✅ |
| Broadcast to many | ❌ | ❌ | ❌ | ✅ | ✅ |

## Notification Types & Use Cases

```
Fall Detection
├── Trigger: Sensor detects fall
├── Recipients: Caregivers + Clinicians in institution
├── Priority: HIGH
└── Action: Navigate to Fall Detail screen

Medication Reminder
├── Trigger: Scheduled time
├── Recipients: Specific elderly user
├── Priority: MEDIUM
└── Action: Navigate to Medications screen

Appointment Reminder
├── Trigger: 24 hours before appointment
├── Recipients: Specific user
├── Priority: MEDIUM
└── Action: Navigate to Appointments screen

Data Access Request
├── Trigger: Request approved/denied
├── Recipients: Requester
├── Priority: LOW
└── Action: Navigate to Data Access Requests

Abnormal Measurement
├── Trigger: Value outside threshold
├── Recipients: Clinicians
├── Priority: HIGH
└── Action: Navigate to Measurement Detail

System Maintenance
├── Trigger: Manual/scheduled
├── Recipients: All users
├── Priority: LOW
└── Action: None (informational)
```
