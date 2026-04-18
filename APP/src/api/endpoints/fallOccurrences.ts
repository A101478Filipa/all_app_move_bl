import { api } from '@src/services/ApiService';
import { FallOccurrence } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const fallOccurrenceApi = {
  getFallOccurrence: (occurrenceId: number): Promise<ApiResponse<FallOccurrence>> =>
    api.get(`/fall-occurrences/${occurrenceId}`).then(response => response.data),

  updateFallOccurrence: (occurrenceId: number, data: any): Promise<ApiResponse> =>
    api.put(`/fall-occurrences/${occurrenceId}`, data).then(response => response.data),

  createFallOccurrence: (elderlyId: number, data: {
    date: Date;
    description?: string;
    injured: boolean;
  }): Promise<ApiResponse<FallOccurrence>> =>
    api.post(`/elderly/${elderlyId}/fall-occurrences`, data).then(response => response.data),
};