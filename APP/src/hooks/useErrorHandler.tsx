import { useToast } from '@providers/ToastProvider';

/**
 * Custom hook that provides error handling utilities
 * Use this hook to replace Alert.alert() calls with toast notifications
 */
export const useErrorHandler = () => {
  const { showError, showSuccess, showWarning, showInfo } = useToast();

  const handleError = (error: any, customMessage?: string) => {
    let message = customMessage;

    if (!message) {
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      } else {
        message = 'An unexpected error occurred';
      }
    }

    showError(message);
  };

  const handleSuccess = (message: string, title?: string) => {
    showSuccess(message, title);
  };

  const handleWarning = (message: string, title?: string) => {
    showWarning(message, title);
  };

  const handleInfo = (message: string, title?: string) => {
    showInfo(message, title);
  };

  // For validation errors
  const handleValidationError = (message: string) => {
    showError(message, 'Falta Informação Obrigatória');
  };

  // For network errors
  const handleNetworkError = () => {
    showError('Network error - please check your connection', 'Connection Error');
  };

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
    handleValidationError,
    handleNetworkError,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
};