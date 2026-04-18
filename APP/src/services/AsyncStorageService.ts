import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppUser, UserConfig } from 'moveplus-shared';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  CONFIG: 'config',
} as const;

class AsyncStorageService {
  async storeAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Error saving access token:', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  async storeRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Error saving refresh token:', error);
      throw error;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async removeAccessToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error removing access token:', error);
      throw error;
    }
  }

  async removeRefreshToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error removing refresh token:', error);
      throw error;
    }
  }

  async storeUser(user: AppUser): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  async getUser(): Promise<AppUser | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async storeAuthData(accessToken: string, refreshToken: string, user: AppUser, config?: UserConfig): Promise<void> {
    try {
      const dataToStore: [string, string][] = [
        [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
        [STORAGE_KEYS.USER, JSON.stringify(user)],
      ];

      if (config) {
        dataToStore.push([STORAGE_KEYS.CONFIG, JSON.stringify(config)]);
      }

      await AsyncStorage.multiSet(dataToStore);
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  }

  async getConfig(): Promise<UserConfig | null> {
    try {
      const configData = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      return configData ? JSON.parse(configData) : null;
    } catch (error) {
      console.error('Error getting config:', error);
      return null;
    }
  }

  async getAuthData(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    user: AppUser | null;
    config: UserConfig | null;
  }> {
    try {
      const [accessToken, refreshToken, userData, configData] = await AsyncStorage.multiGet([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.CONFIG,
      ]);

      return {
        accessToken: accessToken[1],
        refreshToken: refreshToken[1],
        user: userData[1] ? JSON.parse(userData[1]) : null,
        config: configData[1] ? JSON.parse(configData[1]) : null,
      };
    } catch (error) {
      console.error('Error getting auth data:', error);
      return {
        accessToken: null,
        refreshToken: null,
        user: null,
        config: null,
      };
    }
  }

  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.CONFIG,
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error saving item with key ${key}:`, error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item with key ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item with key ${key}:`, error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing all storage:', error);
      throw error;
    }
  }
}

export const asyncStorageService = new AsyncStorageService();
