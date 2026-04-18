import { useAuthStore } from '@src/stores/authStore';
import { setLogoutHandler } from '@src/services/ApiService';

export const useAuth = () => {
  const { logout } = useAuthStore();

  return {
    logout,
  };
};

export const initializeAuth = async () => {
  const logoutHandler = async () => {
    await useAuthStore.getState().logout();
  };

  setLogoutHandler(logoutHandler);

  await useAuthStore.getState().initializeFromStorage();
};
