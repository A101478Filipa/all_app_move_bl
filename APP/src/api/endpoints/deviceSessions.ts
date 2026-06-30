import { api } from '@src/services/ApiService';
import { DeviceSession, ImuSamplePoint } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export type SamplesResponse = {
  sampleRateHz: number;
  totalSamples: number;
  from: number;
  to: number;
  returned: number;
  samples: ImuSamplePoint[];
};

export type CreateDeviceSessionInput = {
  fileName: string;
  collectionType: string;
  collectionCode: string;
  trialNumber: number;
  sampleRateHz?: number;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  notes?: string;
};

/**
 * Uploads the raw IMU recording to the backend. `payload` is the binary
 * stream the belt produced on its SD card.
 */
async function uploadDeviceSession(
  elderlyId: number,
  payload: Uint8Array,
  meta: CreateDeviceSessionInput,
): Promise<ApiResponse<DeviceSession>> {
  const form = new FormData();
  // React Native FormData accepts a blob-like { uri, name, type } OR a real
  // Blob. We don't have a uri here (data is in memory), so build a Blob.
  const blob = new Blob([payload], { type: 'application/octet-stream' });
  form.append('payload', blob as any, `${meta.fileName}.bin`);

  form.append('fileName', meta.fileName);
  form.append('collectionType', meta.collectionType);
  form.append('collectionCode', meta.collectionCode);
  form.append('trialNumber', String(meta.trialNumber));
  if (meta.sampleRateHz != null) form.append('sampleRateHz', String(meta.sampleRateHz));
  form.append('startedAt', meta.startedAt);
  form.append('endedAt', meta.endedAt);
  form.append('durationSeconds', String(meta.durationSeconds));
  if (meta.notes) form.append('notes', meta.notes);

  const res = await api.post(`device-sessions/by-elderly/${elderlyId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export const deviceSessionApi = {
  list: (elderlyId: number): Promise<ApiResponse<DeviceSession[]>> =>
    api.get(`device-sessions/by-elderly/${elderlyId}`).then(r => r.data),

  get: (id: number): Promise<ApiResponse<DeviceSession>> =>
    api.get(`device-sessions/${id}`).then(r => r.data),

  getSamples: (id: number, opts?: { from?: number; to?: number; max?: number }):
    Promise<ApiResponse<SamplesResponse>> => {
    const q = new URLSearchParams();
    if (opts?.from != null) q.set('from', String(opts.from));
    if (opts?.to != null) q.set('to', String(opts.to));
    if (opts?.max != null) q.set('max', String(opts.max));
    const qs = q.toString();
    return api.get(`device-sessions/${id}/samples${qs ? '?' + qs : ''}`).then(r => r.data);
  },

  /** Returns the absolute URL for the raw binary download (use in Linking/share). */
  rawUrl: (id: number) => `device-sessions/${id}/raw`,
  csvUrl: (id: number) => `device-sessions/${id}/csv`,

  delete: (id: number): Promise<ApiResponse<{ id: number }>> =>
    api.delete(`device-sessions/${id}`).then(r => r.data),

  upload: uploadDeviceSession,
};
