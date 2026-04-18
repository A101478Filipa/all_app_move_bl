import { api } from '@src/services/ApiService';
import { SosOccurrence } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const sosOccurrenceApi = {
  getSosOccurrence: (occurrenceId: number): Promise<ApiResponse<SosOccurrence>> =>
    api.get(`/sos-occurrences/${occurrenceId}`).then(response => response.data),

  updateSosOccurrence: (occurrenceId: number, data: any): Promise<ApiResponse> =>
    api.put(`/sos-occurrences/${occurrenceId}`, data).then(response => response.data),

  createSosOccurrence: (elderlyId: number, data: {
    date: Date;
    notes?: string;
  }): Promise<ApiResponse<SosOccurrence>> =>
    api.post(`/elderly/${elderlyId}/sos-occurrences`, data).then(response => response.data),

  getInstitutionSosOccurrences: (): Promise<ApiResponse<SosOccurrence[]>> =>
    api.get('/sos-occurrences/institution').then(response => response.data),
};
