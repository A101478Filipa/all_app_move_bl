import { api } from '@src/services/ApiService';
import { ExternalProfessional } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export interface CreateExternalProfessionalPayload {
  name: string;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export const externalProfessionalApi = {
  list: (): Promise<ApiResponse<ExternalProfessional[]>> =>
    api.get('external-professionals').then(r => r.data),

  create: (data: CreateExternalProfessionalPayload): Promise<ApiResponse<ExternalProfessional>> =>
    api.post('external-professionals', data).then(r => r.data),

  update: (id: number, data: Partial<CreateExternalProfessionalPayload>): Promise<ApiResponse<ExternalProfessional>> =>
    api.put(`external-professionals/${id}`, data).then(r => r.data),

  delete: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`external-professionals/${id}`).then(r => r.data),
};
