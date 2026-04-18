import { Response } from 'express';
import { ApiResponse, ApiErrorResponse, ApiEmptyResponse } from 'moveplus-shared';

export const sendSuccess = <T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200) => {
  const response: ApiResponse<T> = { message, data };
  res.status(statusCode).json(response);
};

export const sendEmptySuccess = (res: Response, message: string = 'Success', statusCode: number = 200) => {
  const response: ApiEmptyResponse = { message };
  res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode: number = 500, code?: string, data?: any) => {
  const response: ApiErrorResponse = { message };
  if (code) response.code = code;
  if (data) response.data = data;
  res.status(statusCode).json(response);
};

export const sendInputValidationError = (res: Response, message: string, errors: any, statusCode: number = 400, code?: string) => {
  const response: ApiErrorResponse = { message, errors };
  if (code) response.code = code;
  res.status(statusCode).json(response);
};
