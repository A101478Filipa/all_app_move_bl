export interface DeviceSession {
  id: number;
  elderlyId: number;
  createdById: number;
  fileName: string;
  /** Human label, e.g. "Marcha" or custom user input. */
  collectionType: string;
  /** Sanitized short code, e.g. "GAIT", "TUG", "POMA", "OTHER", "BERG". */
  collectionCode: string;
  trialNumber: number;
  sampleRateHz: number;
  sampleCount: number;
  fileSizeBytes: number;
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: number; username?: string; email?: string } | null;
  /**
   * NEVER returned by list/get-metadata endpoints. Only available when fetched
   * via the dedicated `/raw` endpoint (response body is the binary octet
   * stream, not JSON).
   */
}

export interface CreateDeviceSessionRequest {
  fileName: string;
  collectionType: string;
  collectionCode: string;
  trialNumber: number;
  sampleRateHz?: number;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  notes?: string;
}

export interface ImuSamplePoint {
  /** Index in the recording (0-based). */
  i: number;
  /** Elapsed time in seconds since start. */
  t: number;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
}

export const DEVICE_SESSION_BYTES_PER_SAMPLE = 24;
export const DEVICE_SESSION_DEFAULT_SAMPLE_RATE_HZ = 100;
