import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { Accelerometer } from 'expo-sensors';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { api } from './ApiService';
import { useIncidentConfirmationStore } from '../stores/incidentConfirmationStore';
import i18n from 'i18next';

const FALL_DETECTION_TASK = 'FALL_DETECTION_TASK';
const INACTIVITY_CHECK_TASK = 'INACTIVITY_CHECK_TASK';

// Fall detection parameters
const FALL_THRESHOLD = 2.5; // G-force threshold for fall detection (typically 2-3G)
const FALL_IMPACT_DURATION = 100; // milliseconds
const POST_FALL_STILLNESS_DURATION = 3000; // 3 seconds of stillness after impact

// Inactivity parameters
const INACTIVITY_THRESHOLD = 0.1; // Minimal movement threshold
const INACTIVITY_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const CHECK_INTERVAL = 15 * 60 * 1000; // Check every 15 minutes

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface FallDetectionState {
  isMonitoring: boolean;
  lastMovementTime: number;
  accelerometerData: AccelerometerData[];
  potentialFallDetected: boolean;
  fallImpactTime: number | null;
  subscription: any;
}

let state: FallDetectionState = {
  isMonitoring: false,
  lastMovementTime: Date.now(),
  accelerometerData: [],
  potentialFallDetected: false,
  fallImpactTime: null,
  subscription: null,
};

/**
 * Calculate magnitude of acceleration vector
 */
function calculateMagnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Detect if acceleration indicates a fall
 * Fall detection algorithm:
 * 1. Sudden high acceleration (impact)
 * 2. Followed by period of low acceleration (stillness on ground)
 */
function detectFall(data: AccelerometerData[]): boolean {
  if (data.length < 2) return false;

  const latest = data[data.length - 1];
  const magnitude = calculateMagnitude(latest.x, latest.y, latest.z);

  // Detect sudden impact (high acceleration)
  if (magnitude > FALL_THRESHOLD && !state.potentialFallDetected) {
    console.log('[Accelerometer] Potential fall impact detected:', magnitude);
    state.potentialFallDetected = true;
    state.fallImpactTime = latest.timestamp;
    return false; // Wait for confirmation
  }

  // Check for stillness after impact
  if (state.potentialFallDetected && state.fallImpactTime) {
    const timeSinceImpact = latest.timestamp - state.fallImpactTime;

    if (timeSinceImpact >= POST_FALL_STILLNESS_DURATION) {
      // Check if user has been relatively still
      const recentData = data.slice(-10); // Last 10 readings
      const avgMagnitude = recentData.reduce((sum, d) =>
        sum + calculateMagnitude(d.x, d.y, d.z), 0) / recentData.length;

      if (avgMagnitude < 1.2) { // Close to 1G (gravity only, no movement)
        console.log('[Accelerometer] Fall confirmed - prolonged stillness after impact');
        state.potentialFallDetected = false;
        state.fallImpactTime = null;
        return true;
      } else {
        // User moved, false alarm
        console.log('[Accelerometer] False alarm - user moved after impact');
        state.potentialFallDetected = false;
        state.fallImpactTime = null;
      }
    }
  }

  return false;
}

/**
 * Check for inactivity (no movement for extended period)
 */
function checkInactivity(data: AccelerometerData[]): boolean {
  if (data.length === 0) return false;

  const latest = data[data.length - 1];
  const magnitude = calculateMagnitude(latest.x, latest.y, latest.z);

  // Subtract gravity (1G) to get actual movement
  const movement = Math.abs(magnitude - 1.0);

  if (movement > INACTIVITY_THRESHOLD) {
    // Movement detected, update last movement time
    state.lastMovementTime = latest.timestamp;
    return false;
  }

  // Check if inactive for too long
  const inactiveDuration = latest.timestamp - state.lastMovementTime;
  if (inactiveDuration >= INACTIVITY_DURATION) {
    console.log('[Accelerometer] No movement for 2 hours');
    return true;
  }

  return false;
}

/**
 * Send incident to backend (called after confirmation or timeout)
 */
async function sendIncidentToServer(type: 'fall' | 'inactivity', data: any): Promise<void> {
  try {
    const endpoint = type === 'fall'
      ? '/notifications/fall-alert'
      : '/notifications/inactivity-alert';

    await api.post(endpoint, data);
    console.log(`[Accelerometer] ${type} incident sent to server successfully`);
  } catch (error) {
    console.error(`[Accelerometer] Error sending ${type} incident to server:`, error);
  }
}

/**
 * Check if app is in foreground
 */
function isAppInForeground(): boolean {
  return AppState.currentState === 'active';
}

/**
 * Show local notification for background incident detection
 */
async function showIncidentNotification(type: 'fall' | 'inactivity'): Promise<void> {
  try {
    const title = type === 'fall'
      ? i18n.t('incidentConfirmation.fallDetected')
      : i18n.t('incidentConfirmation.inactivityDetected');

    const body = type === 'fall'
      ? i18n.t('incidentConfirmation.backgroundFallMessage')
      : i18n.t('incidentConfirmation.backgroundInactivityMessage');

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type, detectedAt: new Date().toISOString() },
      },
      trigger: null,
    });

    console.log(`[Accelerometer] Local notification sent for ${type}`);
  } catch (error) {
    console.error(`[Accelerometer] Error showing notification:`, error);
  }
}

/**
 * Trigger incident confirmation flow
 */
async function triggerIncidentConfirmation(type: 'fall' | 'inactivity'): Promise<void> {
  const incidentData = type === 'fall'
    ? {
        detectedAt: new Date().toISOString(),
        magnitude: state.accelerometerData.length > 0
          ? calculateMagnitude(
              state.accelerometerData[state.accelerometerData.length - 1].x,
              state.accelerometerData[state.accelerometerData.length - 1].y,
              state.accelerometerData[state.accelerometerData.length - 1].z
            )
          : 0,
      }
    : {
        detectedAt: new Date().toISOString(),
        inactiveDuration: Date.now() - state.lastMovementTime,
      };

  if (isAppInForeground()) {
    // App is in foreground - show modal via store
    console.log(`[Accelerometer] App in foreground, showing confirmation modal for ${type}`);

    const store = useIncidentConfirmationStore.getState();
    store.setPendingIncident(
      {
        type,
        detectedAt: incidentData.detectedAt,
        magnitude: 'magnitude' in incidentData ? incidentData.magnitude : undefined,
        inactiveDuration: 'inactiveDuration' in incidentData ? incidentData.inactiveDuration : undefined,
      },
      () => {
        // Auto-confirm after 30 seconds
        console.log(`[Accelerometer] Auto-confirming ${type} incident after timeout`);
        sendIncidentToServer(type, incidentData);
      }
    );
  } else {
    // App is in background - show local notification and auto-confirm after 30s
    console.log(`[Accelerometer] App in background, showing notification for ${type}`);
    await showIncidentNotification(type);

    // Auto-confirm after 30 seconds
    setTimeout(() => {
      console.log(`[Accelerometer] Auto-confirming ${type} incident after timeout (background)`);
      sendIncidentToServer(type, incidentData);
    }, 30000);
  }
}

/**
 * Confirm and send incident to server (exported for use by UI)
 */
export async function confirmAndSendIncident(): Promise<void> {
  const store = useIncidentConfirmationStore.getState();
  const incident = store.getPendingIncident();

  if (!incident) {
    console.log('[Accelerometer] No pending incident to confirm');
    return;
  }

  const incidentData = incident.type === 'fall'
    ? {
        detectedAt: incident.detectedAt,
        magnitude: incident.magnitude || 0,
      }
    : {
        detectedAt: incident.detectedAt,
        inactiveDuration: incident.inactiveDuration || 0,
      };

  store.confirmIncident();
  await sendIncidentToServer(incident.type, incidentData);
}

/**
 * Cancel incident (user is fine)
 */
export function cancelIncident(): void {
  const store = useIncidentConfirmationStore.getState();
  store.cancelIncident();
  console.log('[Accelerometer] Incident cancelled by user');
}

/**
 * Start monitoring accelerometer data
 */
export async function startFallDetection(): Promise<void> {
  if (state.isMonitoring) {
    console.log('[Accelerometer] Already monitoring');
    return;
  }

  console.log('[Accelerometer] Starting fall detection and inactivity monitoring');

  state.isMonitoring = true;
  state.lastMovementTime = Date.now();
  state.accelerometerData = [];
  state.potentialFallDetected = false;
  state.fallImpactTime = null;

  // Set accelerometer update interval (50Hz = 20ms)
  Accelerometer.setUpdateInterval(20);

  // Subscribe to accelerometer
  state.subscription = Accelerometer.addListener((accelerometerData) => {
    const data: AccelerometerData = {
      x: accelerometerData.x,
      y: accelerometerData.y,
      z: accelerometerData.z,
      timestamp: Date.now(),
    };

    // Keep only last 100 readings (2 seconds at 50Hz)
    state.accelerometerData.push(data);
    if (state.accelerometerData.length > 100) {
      state.accelerometerData.shift();
    }

    // Check for fall
    if (detectFall(state.accelerometerData)) {
      triggerIncidentConfirmation('fall');
    }

    // Check for inactivity
    if (checkInactivity(state.accelerometerData)) {
      triggerIncidentConfirmation('inactivity');
      // Reset timer to avoid repeated reports
      state.lastMovementTime = Date.now();
    }
  });

  // Register background task for inactivity checks (iOS/Android)
  if (Platform.OS !== 'web') {
    try {
      await registerBackgroundTask();
    } catch (error) {
      console.error('[Accelerometer] Error registering background task:', error);
    }
  }
}

/**
 * Stop monitoring
 */
export async function stopFallDetection(): Promise<void> {
  console.log('[Accelerometer] Stopping fall detection');

  if (state.subscription) {
    state.subscription.remove();
    state.subscription = null;
  }

  state.isMonitoring = false;
  state.accelerometerData = [];
  state.potentialFallDetected = false;
  state.fallImpactTime = null;

  // Unregister background task
  if (Platform.OS !== 'web') {
    try {
      await BackgroundFetch.unregisterTaskAsync(INACTIVITY_CHECK_TASK);
    } catch (error) {
      console.warn('[Accelerometer] Error unregistering background task:', error);
    }
  }
}

/**
 * Register background task for periodic inactivity checks
 * This runs even when the app is in the background
 */
async function registerBackgroundTask(): Promise<void> {
  try {
    // Define the background task
    TaskManager.defineTask(INACTIVITY_CHECK_TASK, async () => {
      console.log('[Background Task] Checking for inactivity');

      const now = Date.now();
      const inactiveDuration = now - state.lastMovementTime;

      if (inactiveDuration >= INACTIVITY_DURATION) {
        await triggerIncidentConfirmation('inactivity');
        state.lastMovementTime = now;
      }

      return BackgroundFetch.BackgroundFetchResult.NewData;
    });

    await BackgroundFetch.registerTaskAsync(INACTIVITY_CHECK_TASK, {
      minimumInterval: CHECK_INTERVAL / 60000, // in minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[Accelerometer] Background task registered successfully');
  } catch (error) {
    console.error('[Accelerometer] Error in background task registration:', error);
  }
}

/**
 * Check if fall detection is currently running
 */
export function isFallDetectionActive(): boolean {
  return state.isMonitoring;
}

/**
 * Get current state (for debugging)
 */
export function getFallDetectionState(): Partial<FallDetectionState> {
  return {
    isMonitoring: state.isMonitoring,
    lastMovementTime: state.lastMovementTime,
    potentialFallDetected: state.potentialFallDetected,
  };
}
