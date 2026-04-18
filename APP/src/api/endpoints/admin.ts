import { api } from '@src/services/ApiService';
import { InstitutionAdmin } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const adminApi = {
  getAdmin: (adminId: number): Promise<ApiResponse<InstitutionAdmin>> =>
    api.get(`institution-admins/${adminId}`).then(response => response.data),
};