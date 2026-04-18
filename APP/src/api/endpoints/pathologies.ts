import { api } from '@src/services/ApiService';
import { Pathology, UpdatePathologyRequest } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const pathologyApi = {
  getPathology: (pathologyId: number): Promise<ApiResponse<Pathology>> =>
    api.get(`pathologies/${pathologyId}`).then(response => response.data),

  updatePathology: (elderlyId: number, pathologyId: number, data: UpdatePathologyRequest): Promise<ApiResponse<Pathology>> =>
    api.put(`elderly/${elderlyId}/pathologies/${pathologyId}`, data).then(response => response.data),
};