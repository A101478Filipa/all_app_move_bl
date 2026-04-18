import { api } from '@src/services/ApiService';
import {
  ApiResponse,
  CreateInvitationRequest,
  CreateInvitationResponse,
  ValidateInvitationResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  GetInvitationsResponse
} from 'moveplus-shared';

export const invitationsApi = {
  createInvitation: (data: CreateInvitationRequest): Promise<ApiResponse<CreateInvitationResponse>> =>
    api.post('/invitations', data).then(response => response.data),

  validateInvitation: (token: string): Promise<ApiResponse<ValidateInvitationResponse>> =>
    api.get(`/invitations/${token}`).then(response => response.data),

  acceptInvitation: (token: string, data: AcceptInvitationRequest): Promise<ApiResponse<AcceptInvitationResponse>> =>
    api.post(`/invitations/${token}/accept`, data).then(response => response.data),

  getInvitations: (params?: { institutionId?: number; status?: string; invitedById?: number }): Promise<ApiResponse<GetInvitationsResponse>> =>
    api.get('/invitations', { params }).then(response => response.data),

  cancelInvitation: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`/invitations/${id}`).then(response => response.data),
};
