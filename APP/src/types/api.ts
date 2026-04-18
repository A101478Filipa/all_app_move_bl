import { ApiResponse as SharedApiResponse, ApiErrorResponse, PaginatedResponse as SharedPaginatedResponse } from 'moveplus-shared';

export type ApiResponse<T = any> = SharedApiResponse<T>;
export type ErrorResponse = ApiErrorResponse;
export type PaginatedResponse<T> = SharedPaginatedResponse<T>;
