import { api } from '@src/services/ApiService';
import { Measurement } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const measurementApi = {
  getMeasurement: (measurementId: number): Promise<ApiResponse<Measurement>> =>
    api.get(`measurements/${measurementId}`).then(response => response.data),
};