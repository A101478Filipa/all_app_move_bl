import { asyncStorageService } from '@src/services/AsyncStorageService';
import { Credentials, RefreshUserArgs } from '../types/authTypes';
import { AppUser, UserConfig, LoginResponse } from 'moveplus-shared';
import { authApi } from '@src/api/endpoints/auth';

export const authService = {
  login: async (args: Credentials): Promise<LoginResponse> => {
    const response = await authApi.login(args);
    const data = response.data;

    if (data.profileIncomplete) {
      return data;
    }

    await asyncStorageService.storeAuthData(
      data.accessToken!,
      '',
      data.user!,
      data.config!
    );

    return data;
  },

  refreshUser: async (args: RefreshUserArgs): Promise<AppUser> => {
    const response = await authApi.refreshUser(args);
    const data = response.data;

    await asyncStorageService.storeUser(data);

    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error calling logout API:', error);
    }

    await asyncStorageService.clearAuthData();
  },

  logoutAll: async (): Promise<void> => {
    try {
      await authApi.logoutAll();
    } catch (error) {
      console.error('Error calling logout all API:', error);
    }

    await asyncStorageService.clearAuthData();
  }
};
