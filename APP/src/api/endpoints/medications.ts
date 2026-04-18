import { api } from '@src/services/ApiService';
import { Medication } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const medicationApi = {
  getMedication: (medicationId: number): Promise<ApiResponse<Medication>> =>
    api.get(`medications/${medicationId}`).then(response => response.data),
};