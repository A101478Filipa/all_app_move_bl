import Toast from 'react-native-toast-message';

/**
 * Toast utility functions that match the ToastProvider implementation
 * These can be used outside of React components (e.g., in Zustand stores)
 */
export const toastUtils = {
  showSuccess: (message: string, title?: string) => {
    Toast.show({
      type: 'success',
      text1: title || 'Success',
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
    });
  },

  showError: (message: string, title?: string) => {
    Toast.show({
      type: 'error',
      text1: title || 'Error',
      text2: message,
      position: 'top',
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 60,
    });
  },

  showWarning: (message: string, title?: string) => {
    Toast.show({
      type: 'info',
      text1: title || 'Warning',
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
    });
  },

  showInfo: (message: string, title?: string) => {
    Toast.show({
      type: 'info',
      text1: title || 'Information',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
    });
  },
};