export interface ApiResponse<T = any> {
  message: string;
  data: T;
}

export interface ApiEmptyResponse {
  message: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiErrorResponse {
  message: string;
  code?: string;
  error?: any;
  errors?: any;
  data?: any;
}
