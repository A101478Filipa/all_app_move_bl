import { create } from 'zustand';
import * as ImagePicker from 'expo-image-picker';
import { settingsApi } from '@src/api/endpoints/settings';
import ScreenState from '@src/constants/screenState';
import { AppUser } from 'moveplus-shared';
import { Gender } from 'moveplus-shared';
import { ApiResponse, ErrorResponse } from '@src/types/api';
import { useAuthStore } from '@stores/authStore';
import { asyncStorageService } from '@src/services/AsyncStorageService';
import { toastUtils } from '@src/utils/toastUtils';
import i18n from '@src/localization';

export interface UserSettingsForm {
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: Gender | null;
  nif?: string;
  address?: string;
}

interface UserSettingsState {
  form: UserSettingsForm;
  originalForm: UserSettingsForm;
  state: ScreenState;
  avatarUploading: boolean;
  error: ErrorResponse | null;

  initializeForm: (user: AppUser) => void;
  updateFormField: (field: keyof UserSettingsForm, value: string | Gender | null) => void;
  saveSettings: (user: AppUser) => Promise<boolean>;
  pickAndUploadAvatar: (user: AppUser) => Promise<boolean>;
  takePhotoAndUploadAvatar: (user: AppUser) => Promise<boolean>;
  uploadAvatar: (user: AppUser, imageUri: string) => Promise<boolean>;
  resetForm: () => void;
  clearError: () => void;
  hasUnsavedChanges: () => boolean;
}

const initialForm: UserSettingsForm = {
  name: '',
  phone: '',
  email: '',
  birthDate: '',
  gender: null,
  nif: '',
  address: '',
};

const t = (key: string): string => {
  return i18n.t(key);
};

export const useUserSettingsStore = create<UserSettingsState>((set, get) => ({
  form: initialForm,
  originalForm: initialForm,
  state: ScreenState.IDLE,
  avatarUploading: false,
  error: null,

  initializeForm: (user: AppUser) => {
    const getPhoneNumber = (user: AppUser): string => {
      if ('phone' in user) return user.phone || '';
      if ('phoneNumber' in user) return user.phoneNumber || '';
      return '';
    };

    const getBirthDate = (user: AppUser): string => {
      if ('birthDate' in user) return user.birthDate.toString() || '';
      return '';
    };

    const getGender = (user: AppUser): Gender | null => {
      if ('gender' in user) return user.gender || null;
      return null;
    };

    const getEmail = (user: AppUser): string => {
      if ('email' in user.user) return user.user.email || '';
      return '';
    };

    const formData = {
      name: user.name || '',
      phone: getPhoneNumber(user),
      email: getEmail(user),
      birthDate: getBirthDate(user),
      gender: getGender(user),
      nif: (user as any).nif ?? '',
      address: (user as any).address ?? '',
    };

    set({
      form: formData,
      originalForm: formData,
      state: ScreenState.IDLE,
      error: null,
    });
  },

  updateFormField: (field: keyof UserSettingsForm, value: string | Gender | null) => {
    set(state => ({
      form: {
        ...state.form,
        [field]: value,
      },
    }));
  },

  saveSettings: async (user: AppUser): Promise<boolean> => {
    set({ state: ScreenState.LOADING, error: null });
    try {
      const { form } = get();

      if (!form.name.trim()) {
        set({
          state: ScreenState.ERROR,
          error: { message: t('settings.nameRequired') }
        });
        return false;
      }

      const updateData = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        birthDate: form.birthDate,
        gender: form.gender,
        nif: form.nif,
        address: form.address,
      };

      const authState = useAuthStore.getState();
      const baseUrl = authState.config?.baseUrl;

      let response = await settingsApi.updateUserSettings(user.id, baseUrl, updateData);

      if (response.data) {
        const authStore = useAuthStore.getState();
        if (response.data && authStore.setUser) {
          authStore.setUser(response.data);

          await asyncStorageService.storeUser(response.data);
        }

        toastUtils.showSuccess(t('settings.profileUpdatedSuccessfully'));

        set(state => ({
          state: ScreenState.IDLE,
          originalForm: { ...state.form }
        }));
        return true;
      } else {
        set({
          state: ScreenState.ERROR,
          error: { message: response.message || t('settings.failedToUpdateProfile') }
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || error.message || t('settings.failedToUpdateProfileTryAgain');

      set({
        state: ScreenState.ERROR,
        error: { message: errorMessage }
      });
      return false;
    }
  },

  pickAndUploadAvatar: async (user: AppUser): Promise<boolean> => {
    try {
      const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (mediaLibraryStatus.status !== 'granted') {
        set({
          error: { message: t('settings.needCameraRollPermissions') }
        });
        return false;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        return await get().uploadAvatar(user, imageUri);
      }

      return false;
    } catch (error: any) {
      console.error('Error picking image:', error);
      set({
        error: { message: t('settings.failedToSelectImage') }
      });
      return false;
    }
  },

  takePhotoAndUploadAvatar: async (user: AppUser): Promise<boolean> => {
    try {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();

      if (cameraStatus.status !== 'granted') {
        set({
          error: { message: t('settings.needCameraPermissions') }
        });
        return false;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        return await get().uploadAvatar(user, imageUri);
      }

      return false;
    } catch (error: any) {
      console.error('Error taking photo:', error);
      set({
        error: { message: t('settings.failedToTakePhoto') }
      });
      return false;
    }
  },

  uploadAvatar: async (user: AppUser, imageUri: string): Promise<boolean> => {
    set({ avatarUploading: true, error: null });

    try {
      const formData = new FormData();

      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await settingsApi.uploadAvatar(formData);

      if (response.data) {
        set({ avatarUploading: false });
        return true;
      } else {
        set({
          avatarUploading: false,
          error: { message: response.message || t('settings.failedToUploadAvatar') }
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      set({
        avatarUploading: false,
        error: {
          message: error.response?.data?.message || t('settings.failedToUploadAvatarTryAgain')
        }
      });
      return false;
    }
  },

  resetForm: () => {
    set({
      form: initialForm,
      originalForm: initialForm,
      state: ScreenState.IDLE,
      avatarUploading: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  hasUnsavedChanges: () => {
    const { form, originalForm } = get();
    return JSON.stringify(form) !== JSON.stringify(originalForm);
  },
}));
