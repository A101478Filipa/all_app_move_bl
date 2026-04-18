import { api } from '@src/services/ApiService';
import { Credentials, RefreshUserArgs } from '@src/types/authTypes';
import {
  AppUser,
  LoginResponse,
  RegisterElderlyRequest,
  RegisterCaregiverRequest,
  RegistrationResponse,
  ApiEmptyResponse,
  CompleteProfileRequest
} from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const authApi = {
  login: (credentials: Credentials): Promise<ApiResponse<LoginResponse>> =>
    api.post('/auth/login', credentials).then(response => response.data),

  refreshToken: (): Promise<ApiResponse<{ accessToken: string }>> =>
    api.post('/auth/refresh-token').then(response => response.data),

  logout: (): Promise<ApiEmptyResponse> =>
    api.post('/auth/logout').then(response => response.data),

  logoutAll: (): Promise<ApiEmptyResponse> =>
    api.post('/auth/logout-all').then(response => response.data),

  checkUsername: (username: string): Promise<ApiResponse<{ available: boolean }>> =>
    api.get(`/auth/check-username?username=${username}`).then(response => response.data),

  checkEmail: (email: string): Promise<ApiResponse<{ available: boolean }>> =>
    api.get(`/auth/check-email?email=${email}`).then(response => response.data),

  refreshUser: (args: RefreshUserArgs): Promise<ApiResponse<AppUser>> =>
    api.get(`/${args.baseUrl}/${args.id}`).then(response => response.data),

  registerElderly: (data: RegisterElderlyRequest): Promise<ApiResponse<RegistrationResponse>> =>
    api.post('/auth/register/elderly', data).then(response => response.data),

  registerCaregiver: (data: RegisterCaregiverRequest): Promise<ApiResponse<RegistrationResponse>> =>
    api.post('/auth/register/caregiver', data).then(response => response.data),

  registerClinicianSelf: (data: { username: string; email: string; password: string }): Promise<ApiResponse<{ userId: number }>> =>
    api.post('/auth/register/clinician/self', data).then(response => response.data),

  completeProfile: (data: CompleteProfileRequest): Promise<ApiResponse<any>> =>
    api.post('/auth/complete-profile', data).then(response => response.data),
};
