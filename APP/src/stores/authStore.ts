import { create } from 'zustand';
import { AppUser, UserConfig, UserRole, ProfileIncompleteData } from 'moveplus-shared';
import { authService } from '@src/services/authService';
import { asyncStorageService } from '@src/services/AsyncStorageService';
import { Credentials, RefreshUserArgs } from '@src/types/authTypes';
import { startFallDetection, stopFallDetection } from '@services/accelerometerService';
import { notificationApi } from '@src/api/endpoints/notifications';
import { setIsLoggingOut } from '@src/services/ApiService';

type LoginResult =
  | { success: true }
  | { success: false; profileIncomplete: true; profileData: ProfileIncompleteData };

type AuthState = {
  user: AppUser | null;
  config: UserConfig | null;
  loading: boolean;
  error: string | null;

  setLoading: (loading: boolean) => void;
  login: (credentials: Credentials) => Promise<LoginResult>;
  refreshUser: (args: RefreshUserArgs) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AppUser | null) => void;
  initializeFromStorage: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  config: null,
  loading: false,
  error: null,

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  login: async (credentials: Credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login(credentials);

      if (response.profileIncomplete) {
        set({ loading: false, error: null });
        return {
          success: false,
          profileIncomplete: true,
          profileData: response.profileData!
        };
      }

      set({ user: response.user!, config: response.config!, loading: false, error: null });

      if (response.user!.user.role === UserRole.ELDERLY) {
        console.log('[Auth] Elderly user logged in, starting fall detection');
        await startFallDetection();
      }

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Login failed';
      set({ user: null, config: null, loading: false, error: errorMessage });
      throw error;
    }
  },

  refreshUser: async (args: RefreshUserArgs) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.refreshUser(args);
      set({ user, loading: false, error: null });
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Refresh failed';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    setIsLoggingOut(true);

    try {
      const currentUser = get().user;

      if (currentUser?.user.role === UserRole.ELDERLY) {
        console.log('[Auth] Elderly user logging out, stopping fall detection');
        await stopFallDetection();
      }

      try {
        await notificationApi.removePushToken();
        console.log('[Auth] Push notification token removed from server');
      } catch (error) {
        console.error('[Auth] Failed to remove push token on logout:', error);
      }

      await authService.logout();
      set({ user: null, config: null, loading: false, error: null });
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Logout failed';
      set({ loading: false, error: errorMessage });
      throw error;
    } finally {
      setIsLoggingOut(false);
    }
  },

  logoutAll: async () => {
    set({ loading: true, error: null });
    setIsLoggingOut(true);

    try {
      const currentUser = get().user;

      if (currentUser?.user.role === UserRole.ELDERLY) {
        console.log('[Auth] Elderly user logging out (all devices), stopping fall detection');
        await stopFallDetection();
      }

      try {
        await notificationApi.removePushToken();
        console.log('[Auth] Push notification token removed from server');
      } catch (error) {
        console.error('[Auth] Failed to remove push token on logout all:', error);
      }

      await authService.logoutAll();
      set({ user: null, config: null, loading: false, error: null });
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Logout all failed';
      set({ loading: false, error: errorMessage });
      throw error;
    } finally {
      setIsLoggingOut(false);
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setUser: (user: AppUser | null) => {
    set({ user });
  },

  initializeFromStorage: async () => {
    try {
      const authData = await asyncStorageService.getAuthData();

      if (authData.user && authData.config) {
        set({
          user: authData.user,
          config: authData.config,
          error: null
        });

        if (authData.user.user.role === UserRole.ELDERLY) {
          console.log('[Auth] Elderly user restored from storage, starting fall detection');
          await startFallDetection();
        }
      }
    } catch (error) {
      console.error('Error initializing auth from storage:', error);
    }
  },
}));
