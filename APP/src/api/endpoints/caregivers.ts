import { api } from '@src/services/ApiService';
import { Caregiver } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const caregiverApi = {
  getCaregiver: (caregiverId: number): Promise<ApiResponse<Caregiver>> =>
    api.get(`caregivers/${caregiverId}`).then(response => response.data),
};