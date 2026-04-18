# Implemented Push Notifications

This document describes the two concrete push notification scenarios that have been implemented in the system.

## 1. Fall Occurrence Notifications

### Trigger
When an elderly person reports a fall occurrence through the `POST /api/elderly/:elderlyId/fall-occurrences` endpoint.

### Recipients
- **All caregivers** in the elderly person's institution
- **All institution admins** in the elderly person's institution

### Notification Details
- **Title:** ⚠️ Fall Alert
- **Body:** `{elderlyName} has reported a fall occurrence. Please check immediately.`
- **Data:**
  ```json
  {
    "type": "fall_occurrence",
    "elderlyId": 123,
    "fallOccurrenceId": 456,
    "screen": "FallOccurrenceDetail",
    "timestamp": "2025-10-31T10:30:00.000Z"
  }
  ```

### Implementation Location
- File: `server/src/modules/fallOccurrence/fallOccurrenceController.ts`
- Function: `sendFallOccurrenceNotifications()`
- Called in: `createFallOccurrence()` controller function

### How It Works
1. When a fall occurrence is created, the system queries the database for the elderly's institution
2. Retrieves all caregivers and admins associated with that institution
3. Collects valid push tokens from these users
4. Sends a batch notification to all recipients
5. Logs the number of successful notifications sent
6. If notifications fail, the error is logged but the fall occurrence creation still succeeds

### Example Usage
```typescript
// This happens automatically when a fall is reported
POST /api/elderly/123/fall-occurrences
{
  "severity": "high",
  "notes": "Patient fell in bathroom",
  "injuryReported": true
}

// Result: All caregivers and admins in the institution receive a push notification
```

---

## 2. Data Access Request Notifications

### Trigger
When a clinician requests access to an elderly person's data through the `POST /api/data-access-requests` endpoint.

### Recipients
- **The elderly person** whose data is being requested

### Notification Details
- **Title:** 🔔 Data Access Request
- **Body:** `Dr. {clinicianUsername} has requested access to your health data. Please review and respond.`
- **Data:**
  ```json
  {
    "type": "data_access_request",
    "requestId": 789,
    "screen": "DataAccessRequests",
    "timestamp": "2025-10-31T10:30:00.000Z"
  }
  ```

### Implementation Location
- File: `server/src/modules/dataAccessRequest/dataAccessRequestController.ts`
- Function: `sendDataAccessRequestNotification()`
- Called in: `createDataAccessRequest()` controller function

### How It Works
1. When a clinician creates a data access request, the system includes the elderly user's push token in the query
2. Also includes the clinician's username for personalization
3. Validates the push token before attempting to send
4. Sends a notification to the elderly person
5. Logs success or failure
6. If the notification fails, the error is logged but the request creation still succeeds

### Example Usage
```typescript
// Clinician requests access to elderly data
POST /api/data-access-requests
{
  "elderlyId": 123,
  "notes": "Need to review recent health measurements"
}

// Result: The elderly person (ID 123) receives a push notification
```

---

## Testing the Notifications

### Prerequisites
1. Server must be running
2. Mobile app must be running on a physical device
3. Users must be logged in and have registered push tokens
4. Users must have granted notification permissions

### Test Fall Occurrence Notification

1. **Create a test fall occurrence:**
   ```bash
   POST http://localhost:3000/api/elderly/{elderlyId}/fall-occurrences
   Authorization: Bearer {token}
   Content-Type: application/json

   {
     "severity": "medium",
     "notes": "Test fall",
     "injuryReported": false
   }
   ```

2. **Expected behavior:**
   - All caregivers in the elderly's institution receive a notification
   - All admins in the elderly's institution receive a notification
   - Server logs show: `Fall occurrence notification sent to X recipients`

3. **On mobile device:**
   - Notification appears with title "⚠️ Fall Alert"
   - Tapping the notification should navigate to FallOccurrenceDetail screen

### Test Data Access Request Notification

1. **Create a test data access request (as a clinician):**
   ```bash
   POST http://localhost:3000/api/data-access-requests
   Authorization: Bearer {clinicianToken}
   Content-Type: application/json

   {
     "elderlyId": 123,
     "notes": "Test access request"
   }
   ```

2. **Expected behavior:**
   - The elderly person (ID 123) receives a notification
   - Server logs show: `Data access request notification sent successfully to elderly user`

3. **On elderly's mobile device:**
   - Notification appears with title "🔔 Data Access Request"
   - Message includes the clinician's username
   - Tapping the notification should navigate to DataAccessRequests screen

---

## Error Handling

Both notification implementations follow these error handling principles:

1. **Non-blocking:** If notifications fail, the main operation (creating fall occurrence or access request) still succeeds
2. **Logging:** All errors are logged with descriptive messages
3. **Graceful degradation:** Missing push tokens or invalid tokens are handled gracefully
4. **Validation:** Push tokens are validated before attempting to send notifications

### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No notifications sent | Users don't have push tokens | Users need to login on mobile app to register tokens |
| Notification sent but not received | Invalid push token | User should logout and login again to refresh token |
| Notification fails with DeviceNotRegistered | Token expired or app uninstalled | Token will be automatically cleaned up by receipt checking |
| Server logs show 0 recipients | Institution has no caregivers/admins | Add caregivers or admins to the institution |

---

## Monitoring and Debugging

### Server Logs to Check

1. **Fall Occurrence Notifications:**
   ```
   ✅ Success: "Fall occurrence notification sent to X recipients (Y successful)"
   ⚠️  Warning: "No push tokens found for caregivers/admins, skipping notifications"
   ⚠️  Warning: "Elderly has no institution, skipping notifications"
   ❌ Error: "Error sending fall occurrence notifications: {error}"
   ```

2. **Data Access Request Notifications:**
   ```
   ✅ Success: "Data access request notification sent successfully to elderly user"
   ⚠️  Warning: "Elderly user has no push token, skipping notification"
   ⚠️  Warning: "Invalid push token for elderly user, skipping notification"
   ❌ Error: "Error sending data access request notification: {error}"
   ```

### Testing Checklist

- [ ] Fall occurrence created successfully
- [ ] Server logs show notification sent
- [ ] Caregivers receive notification on mobile
- [ ] Admins receive notification on mobile
- [ ] Tapping notification navigates to correct screen
- [ ] Data access request created successfully
- [ ] Elderly receives notification on mobile
- [ ] Notification message includes clinician name
- [ ] Tapping notification navigates to requests screen

---

## Future Enhancements

Potential improvements to consider:

1. **Notification Preferences:** Allow users to customize which notifications they receive
2. **Quiet Hours:** Don't send notifications during user-defined quiet hours
3. **Notification History:** Store notification history in database
4. **Read Receipts:** Track when notifications are read
5. **Severity Levels:** Different notification sounds/priorities based on severity
6. **Localization:** Send notifications in user's preferred language
7. **Rich Notifications:** Add images or action buttons to notifications

---

**Last Updated:** October 31, 2025
**Status:** ✅ Implemented and Ready for Testing
