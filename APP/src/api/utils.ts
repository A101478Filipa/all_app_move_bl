import { ApiResponse, ErrorResponse } from '@src/types/api';

export const isErrorResponse = (response: any): response is ErrorResponse => {
  return response && typeof response === 'object' && 'message' in response && response.status >= 400;
};

export const handleApiError = (error: any): ErrorResponse => {
  if (error.response) {
    return {
      message: error.response.data?.message || 'Server error occurred',
      error: error.response.data,
    };
  } else if (error.request) {
    return {
      message: 'Network error - please check your connection',
      error: error.request,
    };
  } else {
    return {
      message: error.message || 'An unexpected error occurred',
      error: error,
    };
  }
};
