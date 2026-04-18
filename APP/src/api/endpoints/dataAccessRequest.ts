import { api } from '@src/services/ApiService';
import { ApiResponse } from '@src/types/api';
import { Elderly, Clinician } from 'moveplus-shared';

export interface DataAccessRequest {
  id: number;
  clinicianId: number;
  elderlyId: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'REVOKED';
  requestedAt: Date;
  respondedAt?: Date;
  expiresAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  elderly?: Elderly;
  clinician?: Clinician;
}

type DataAccessRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'REVOKED';

interface CreateAccessRequestData {
  elderlyId: number;
  notes?: string;
}

interface RespondToRequestData {
  status: DataAccessRequestStatus;
}

interface CheckAccessResponse {
  hasAccess: boolean;
  status: DataAccessRequestStatus | null;
  request?: DataAccessRequest;
}

export const dataAccessRequestApi = {
  createRequest: (data: CreateAccessRequestData): Promise<ApiResponse<DataAccessRequest>> =>
    api.post('data-access-requests', data).then(response => response.data),

  getMyRequests: (): Promise<ApiResponse<DataAccessRequest[]>> =>
    api.get('data-access-requests/my-requests').then(response => response.data),

  respondToRequest: (id: number, data: RespondToRequestData): Promise<ApiResponse<DataAccessRequest>> =>
    api.patch(`data-access-requests/${id}/respond`, data).then(response => response.data),

  respondToRequestAsCaregiver: (id: number, data: RespondToRequestData): Promise<ApiResponse<DataAccessRequest>> =>
    api.patch(`data-access-requests/${id}/respond-as-caregiver`, data).then(response => response.data),

  checkAccess: (elderlyId: number): Promise<ApiResponse<CheckAccessResponse>> =>
    api.get(`data-access-requests/check-access/${elderlyId}`).then(response => response.data),
};
