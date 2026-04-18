import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { asyncStorageService } from './AsyncStorageService';
import { SERVER_ADDRESS as _SERVER_ADDRESS, SERVER_PORT as _SERVER_PORT } from '@env';
const SERVER_ADDRESS = _SERVER_ADDRESS?.trim();
const SERVER_PORT = _SERVER_PORT?.trim();
import Toast from 'react-native-toast-message';
import { Platform } from 'react-native';

let logoutHandler: (() => Promise<void>) | null = null;
let isRefreshing = false;
let isLoggingOut = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (error?: any) => void }> = [];

export const setLogoutHandler = (handler: () => Promise<void>) => {
  logoutHandler = handler;
};

export const setIsLoggingOut = (value: boolean) => {
  isLoggingOut = value;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

const getServerAddress = () => {
  if (Platform.OS === 'android' && SERVER_ADDRESS === 'localhost') {
    return '10.0.2.2';
  }
  return SERVER_ADDRESS;
};

const serverAddress = getServerAddress();

console.log(`[ApiService] Platform: ${Platform.OS}, Server Address: ${serverAddress}:${SERVER_PORT}`);

export const api = axios.create({
  baseURL: `http://${serverAddress}:${SERVER_PORT}/api`,
  timeout: 15000,
  withCredentials: true,
});

export const buildAvatarUrl = (avatar: string) => {
  if (avatar && avatar.startsWith('default/')) {
    return `http://${serverAddress}:${SERVER_PORT}/${avatar}`;
  }

  return `http://${serverAddress}:${SERVER_PORT}/uploads/${avatar}`;
};

api.interceptors.request.use(async (config) => {
  const token = await asyncStorageService.getAccessToken();

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error: AxiosError) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const data = error.response?.data as { message?: string; error?: string; code?: string } | undefined;
    const message = data?.message || data?.error;
    const status = error?.response?.status;
    const errorCode = data?.code;

    if (status === 401 && errorCode === 'LOGIN_FAILED') {
      console.error('Login failed:', message);
      return Promise.reject(new Error(message || 'Invalid credentials'));
    }

    // If we're already logging out, don't try to refresh or logout again
    if (isLoggingOut) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`http://${serverAddress}:${SERVER_PORT}/api/auth/refresh-token`, {}, {
          withCredentials: true,
        });

        const newAccessToken = response.data.data.accessToken;

        if (newAccessToken) {
          await asyncStorageService.storeAccessToken(newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          processQueue(null, newAccessToken);
          isRefreshing = false;

          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;

        if (!isLoggingOut) {
          isLoggingOut = true;
          await asyncStorageService.removeAccessToken();
          await asyncStorageService.removeRefreshToken();
          await logoutHandler?.();
          isLoggingOut = false;
        }

        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
    }

    if (message) {
      console.error('Server error message:', message);
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: message,
        position: 'top',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 60,
      });
      return Promise.reject(new Error(message));
    }

    return Promise.reject(error);
  }
);
