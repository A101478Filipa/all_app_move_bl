# Fall Detection and Inactivity Monitoring System

## Overview
This system uses the device's accelerometer to detect potential falls and prolonged inactivity for elderly users, even when the app is running in the background. When a fall or inactivity is detected, caregivers are automatically notified.

## Features

### 1. Fall Detection
- **Algorithm**: Detects sudden high acceleration (impact) followed by prolonged stillness
- **Threshold**: 2.5 G-force for impact detection
- **Confirmation**: Requires 3 seconds of stillness after impact to confirm a fall
- **Sensitivity**: 50Hz sampling rate (20ms intervals) for accurate detection

### 2. Inactivity Detection
- **Duration**: Alerts after 2 hours of no movement
- **Threshold**: Movement detection at 0.1 G (minimal movement)
- **Check Interval**: Background checks every 15 minutes to conserve battery

### 3. Background Monitoring
- **Technology**: Uses `expo-task-manager` and `expo-background-fetch`
- **Platform Support**: iOS and Android
- **Foreground & Background**: Works when app is active or in background
- **Automatic Start**: Starts when elderly user logs in
- **Automatic Stop**: Stops when elderly user logs out

## How It Works

### Fall Detection Algorithm
1. **Continuous Monitoring**: Accelerometer data sampled at 50Hz
2. **Impact Detection**: Monitors for acceleration > 2.5G
3. **Stillness Check**: After impact, checks if user remains still for 3 seconds
4. **Fall Confirmation**: If still, confirms fall and sends alert
5. **False Positive Handling**: If user moves after impact, discards as false alarm

### Inactivity Detection
1. **Movement Tracking**: Calculates movement by comparing acceleration to gravity (1G)
2. **Time Tracking**: Records timestamp of last detected movement
3. **Duration Check**: Compares time since last movement to 2-hour threshold
4. **Alert Generation**: Sends notification if threshold exceeded

### Notification Flow
1. **Detection**: Fall or inactivity detected by accelerometer service
2. **API Call**: Mobile app calls `/api/fall-occurrences/detect` endpoint
3. **Database**: Creates FallOccurrence record in database
4. **Timeline**: Adds activity to institution timeline
5. **Notifications**: Sends push notifications to all caregivers/admins
6. **Notification Center**: Appears in caregiver notification centers

## Implementation Details

### Frontend (React Native/Expo)

#### Service: `fallDetectionService.ts`
```typescript
// Start monitoring (automatically called on elderly login)
await startFallDetection();

// Stop monitoring (automatically called on elderly logout)
await stopFallDetection();

// Check if monitoring is active
const isActive = isFallDetectionActive();
```

#### Auth Integration: `authStore.ts`
- **Login**: Automatically starts fall detection for elderly users
- **Logout**: Automatically stops fall detection
- **Session Restore**: Resumes fall detection if elderly user was logged in

### Backend (Node.js/Express/Prisma)

#### Endpoint: `POST /api/fall-occurrences/detect`
**Request Body**:
```json
{
  "type": "fall" | "inactivity",
  "detectedAt": "2025-10-31T12:00:00Z",
  "magnitude": 2.8
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "elderlyId": 45,
    "date": "2025-10-31T12:00:00Z",
    "description": "Automatically detected fall (magnitude: 2.80G)",
    "injured": false,
    "isFalseAlarm": false
  }
}
```

#### Authorization
- **Authenticated**: Requires valid JWT token
- **Role Restriction**: Only elderly users can use this endpoint
- **User Validation**: Automatically uses authenticated elderly's ID

## Configuration

### App Permissions (`app.json`)

#### iOS
```json
{
  "NSMotionUsageDescription": "This app uses motion sensors to detect falls and ensure your safety.",
  "UIBackgroundModes": ["fetch", "processing"]
}
```

#### Android
```json
{
  "permissions": [
    "android.permission.ACTIVITY_RECOGNITION",
    "android.permission.HIGH_SAMPLING_RATE_SENSORS",
    "android.permission.FOREGROUND_SERVICE"
  ]
}
```

### Adjustable Parameters (in `fallDetectionService.ts`)

```typescript
// Fall detection
const FALL_THRESHOLD = 2.5; // G-force threshold
const POST_FALL_STILLNESS_DURATION = 3000; // milliseconds

// Inactivity
const INACTIVITY_THRESHOLD = 0.1; // Minimal movement threshold
const INACTIVITY_DURATION = 2 * 60 * 60 * 1000; // 2 hours
const CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes
```

## Testing

### Test Fall Detection
1. Log in as elderly user
2. Verify console shows: "[Auth] Elderly user logged in, starting fall detection"
3. Simulate fall by shaking device vigorously then holding still
4. Check server logs for fall detection
5. Verify caregivers receive notifications

### Test Inactivity Detection
1. Log in as elderly user
2. Leave device completely still for extended period
3. Background task will check every 15 minutes
4. After 2 hours, inactivity should be reported

### Debug Logging
- All operations logged with `[Fall Detection]` prefix
- Check mobile console for detection events
- Check server logs for API calls and notifications

## Limitations & Considerations

### Battery Impact
- Continuous accelerometer monitoring does consume battery
- Background fetch limited by OS battery optimization
- Consider implementing user-configurable sensitivity levels

### False Positives
- Quick movements (jumping, running) may trigger false positives
- Post-impact stillness check reduces but doesn't eliminate false alarms
- Users can mark occurrences as "false alarm" in the app

### Platform Differences
- iOS: Background execution limited by system
- Android: More aggressive battery optimization may affect monitoring
- Web: Background monitoring not supported

### Privacy
- Motion data is NOT stored
- Only fall/inactivity events are recorded
- No continuous tracking of user movements

## Future Enhancements

1. **Machine Learning**: Train ML model on fall patterns for better accuracy
2. **Context Awareness**: Integrate with other sensors (location, heart rate)
3. **User Feedback**: Allow users to confirm/dismiss alerts
4. **Customization**: Per-user sensitivity and threshold configuration
5. **Emergency Services**: Direct integration with emergency services
6. **Wearable Integration**: Support for smartwatches and fitness trackers

## Support

For issues or questions, check:
- Console logs for `[Fall Detection]` entries
- Backend logs for API errors
- Notification provider logs for delivery issues
- Device permissions in system settings
