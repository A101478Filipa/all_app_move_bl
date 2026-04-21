import { api } from '@src/services/ApiService';
import { ApiResponse } from '@src/types/api';

export interface WoundTracking {
  id: number;
  fallOccurrenceId?: number | null;
  sosOccurrenceId?: number | null;
  elderlyId?: number | null;
  createdByUserId: number;
  photoUrl?: string | null;
  notes?: string | null;
  isResolved: boolean;
  createdAt: string;
  createdByUser: { id: number };
}

export interface WoundCase {
  occurrenceType: 'fall' | 'sos';
  occurrenceId: number;
  occurrenceDate: string;
  referenceDate: string;
  isResolved: boolean;
  injuryDescription: string | null;
  measuresTaken: string | null;
  latestTracking: WoundTracking | null;
}

export const woundTrackingApi = {
  getFallWoundTrackings: (occurrenceId: number): Promise<ApiResponse<WoundTracking[]>> =>
    api.get(`/wound-tracking/fall-occurrences/${occurrenceId}`, { _silentError: true } as any).then(r => r.data),

  addFallWoundTracking: (occurrenceId: number, formData: FormData): Promise<ApiResponse<WoundTracking>> =>
    api.post(`/wound-tracking/fall-occurrences/${occurrenceId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  getSosWoundTrackings: (occurrenceId: number): Promise<ApiResponse<WoundTracking[]>> =>
    api.get(`/wound-tracking/sos-occurrences/${occurrenceId}`, { _silentError: true } as any).then(r => r.data),

  addSosWoundTracking: (occurrenceId: number, formData: FormData): Promise<ApiResponse<WoundTracking>> =>
    api.post(`/wound-tracking/sos-occurrences/${occurrenceId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  getElderlyWoundTrackings: (elderlyId: number): Promise<ApiResponse<WoundTracking[]>> =>
    api.get(`/wound-tracking/elderly/${elderlyId}`, { _silentError: true } as any).then(r => r.data),

  getElderlyWoundCases: (elderlyId: number): Promise<ApiResponse<WoundCase[]>> =>
    api.get(`/wound-tracking/elderly/${elderlyId}/cases`, { _silentError: true } as any).then(r => r.data),

  addElderlyWoundTracking: (elderlyId: number, formData: FormData): Promise<ApiResponse<WoundTracking>> =>
    api.post(`/wound-tracking/elderly/${elderlyId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  deleteWoundTracking: (trackingId: number): Promise<ApiResponse> =>
    api.delete(`/wound-tracking/${trackingId}`).then(r => r.data),
};
