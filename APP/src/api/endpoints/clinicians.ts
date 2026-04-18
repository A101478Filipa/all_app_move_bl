import { api } from '@src/services/ApiService';
import { Clinician } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const clinicianApi = {
  getClinician: (clinicianId: number): Promise<ApiResponse<Clinician>> =>
    api.get(`clinicians/${clinicianId}`).then(response => response.data),
};
