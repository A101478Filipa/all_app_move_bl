import React, { useEffect } from 'react';
import { useAuthStore } from '@stores/authStore';
import { asyncStorageService } from '@services/AsyncStorageService';
import { initializeAuth } from '@utils/authHelpers';

interface AuthManagerProps {
  children: React.ReactNode;
}

export const AuthManager: React.FC<AuthManagerProps> = ({ children }) => {
  const { setLoading, setUser, clearError } = useAuthStore();

  useEffect(() => {
    const initialize = async () => {
      await initializeAuth();
    };

    initialize();

    const restoreAuth = async () => {
      try {
        setLoading(true);
        clearError();

        const { accessToken, user } = await asyncStorageService.getAuthData();

        if (user && accessToken) {
          // TODO: Validate token with server
          // const isValidToken = await validateToken(accessToken);
          // if (isValidToken) {
            setUser(user);
          // } else {
          //   await asyncStorageService.clearAuthData();
          // }
        }
      } catch (error) {
        console.error('Failed to restore authentication:', error);
        await asyncStorageService.clearAuthData();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreAuth();
  }, [setLoading, setUser, clearError]);

  return <>{children}</>;
};
