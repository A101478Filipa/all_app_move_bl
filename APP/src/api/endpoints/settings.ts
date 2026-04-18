import { api } from '@src/services/ApiService';
import { ApiEmptyResponse, AppUser } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const settingsApi = {
  updateUserSettings: (userId: number, baseUrl: string, updateData: any): Promise<ApiResponse<any>> =>
    api.put(`/${baseUrl}/${userId}`, updateData).then(response => response.data),

  uploadAvatar: (formData: FormData): Promise<ApiResponse<any>> =>
    api.post(`/avatar/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(response => response.data),

    updateProfile: (userId: number, profileData: {
      name?: string;
      phone?: string;
      email?: string;
      birthDate?: string;
      gender?: string;
      nif?: string;          
      address?: string;      
    }): Promise<ApiResponse<any>> =>
      api.put(`/profile/${userId}`, profileData).then(response => response.data),
};
