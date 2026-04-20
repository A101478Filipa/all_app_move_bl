import { api } from '@src/services/ApiService';
import { ApiResponse } from '@src/types/api';
import { StaffTimeOff, CreateTimeOffRequest, UpdateTimeOffRequest } from 'moveplus-shared';

export type StaffTimeOffWithUser = StaffTimeOff & {
  user: { id: number; name: string; role: string };
};

export const timeOffApi = {
  getTimeOffs: (userId: number): Promise<ApiResponse<StaffTimeOff[]>> =>
    api.get(`time-off/${userId}`).then(r => r.data),

  getInstitutionTimeOffs: (): Promise<ApiResponse<StaffTimeOffWithUser[]>> =>
    api.get('time-off/institution').then(r => r.data),

  createTimeOff: (data: CreateTimeOffRequest): Promise<ApiResponse<StaffTimeOff>> =>
    api.post('time-off', data).then(r => r.data),

  updateTimeOff: (id: number, data: UpdateTimeOffRequest): Promise<ApiResponse<StaffTimeOff>> =>
    api.put(`time-off/${id}`, data).then(r => r.data),

  deleteTimeOff: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`time-off/${id}`).then(r => r.data),
};
