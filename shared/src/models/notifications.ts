/**
 * Base notification data that all push notifications should include
 */
export interface NotificationData {
  type: string;
  timestamp: string;
  screen?: string;
  titleKey?: string;
  bodyKey?: string;
  params?: Record<string, any>;
}

/**
 * Fall occurrence notification data
 */
export interface FallOccurrenceNotificationData extends NotificationData {
  type: 'fall_occurrence';
  elderlyId: number;
  fallOccurrenceId: number;
  params: {
    elderlyName: string;
  };
}

/**
 * Fall detection alert notification data
 */
export interface FallDetectionAlertNotificationData extends NotificationData {
  type: 'fall_detection_alert';
  elderlyId: number;
  fallOccurrenceId?: number;
  detectedAt: string;
  magnitude?: number;
  params: {
    elderlyName: string;
  };
}

/**
 * Inactivity alert notification data
 */
export interface InactivityAlertNotificationData extends NotificationData {
  type: 'inactivity_alert';
  elderlyId: number;
  detectedAt: string;
  inactiveDuration?: number;
  params: {
    elderlyName: string;
  };
}

/**
 * Data access request notification data
 */
export interface DataAccessRequestNotificationData extends NotificationData {
  type: 'data_access_request';
  requestId: number;
  params: {
    clinicianUsername: string;
  };
}

/**
 * SOS occurrence notification data
 */
export interface SosOccurrenceNotificationData extends NotificationData {
  type: 'sos_occurrence';
  elderlyId: number;
  sosOccurrenceId: number;
  params: {
    elderlyName: string;
  };
}

/**
 * Time-off request notification data (sent to institution admins)
 */
export interface TimeOffRequestNotificationData extends NotificationData {
  type: 'time_off_request';
  timeOffId: number;
  params: {
    requesterName: string;
    timeOffType: string;
    startDate: string;
    endDate: string;
  };
}

/**
 * Union type of all notification data types
 */
export type AnyNotificationData =
  | FallOccurrenceNotificationData
  | FallDetectionAlertNotificationData
  | InactivityAlertNotificationData
  | DataAccessRequestNotificationData
  | SosOccurrenceNotificationData
  | TimeOffRequestNotificationData;

/**
 * Notification translation keys for fall alerts
 */
export const FallAlertNotificationKeys = {
  titleKey: 'notifications.fallAlert.title',
  bodyKey: 'notifications.fallAlert.body',
} as const;

/**
 * Notification translation keys for fall detection alerts
 */
export const FallDetectionAlertNotificationKeys = {
  titleKey: 'notifications.fallDetectionAlert.title',
  bodyKey: 'notifications.fallDetectionAlert.body',
} as const;

/**
 * Notification translation keys for inactivity alerts
 */
export const InactivityAlertNotificationKeys = {
  titleKey: 'notifications.inactivityAlert.title',
  bodyKey: 'notifications.inactivityAlert.body',
} as const;

/**
 * Notification translation keys for data access requests
 */
export const DataAccessRequestNotificationKeys = {
  titleKey: 'notifications.dataAccessRequest.title',
  bodyKey: 'notifications.dataAccessRequest.body',
} as const;

/**
 * Notification translation keys for SOS alerts
 */
export const SosAlertNotificationKeys = {
  titleKey: 'notifications.sosAlert.title',
  bodyKey: 'notifications.sosAlert.body',
} as const;

/**
 * Notification translation keys for time-off requests
 */
export const TimeOffRequestNotificationKeys = {
  titleKey: 'notifications.timeOffRequest.title',
  bodyKey: 'notifications.timeOffRequest.body',
} as const;

/**
 * All notification translation keys
 */
export const NotificationKeys = {
  fallAlert: FallAlertNotificationKeys,
  fallDetectionAlert: FallDetectionAlertNotificationKeys,
  inactivityAlert: InactivityAlertNotificationKeys,
  dataAccessRequest: DataAccessRequestNotificationKeys,
  sosAlert: SosAlertNotificationKeys,
  timeOffRequest: TimeOffRequestNotificationKeys,
} as const;

/**
 * Notification type constants
 */
export const NotificationType = {
  FALL_OCCURRENCE: 'fall_occurrence',
  FALL_DETECTION_ALERT: 'fall_detection_alert',
  INACTIVITY_ALERT: 'inactivity_alert',
  DATA_ACCESS_REQUEST: 'data_access_request',
  SOS_OCCURRENCE: 'sos_occurrence',
  TIME_OFF_REQUEST: 'time_off_request',
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];
