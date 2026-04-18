import { api } from '@src/services/ApiService';
import { ApiResponse } from '@src/types/api';
import { StaffWorkSchedule, UpsertWorkScheduleRequest } from 'moveplus-shared';

export const staffScheduleApi = {
  getSchedule: (userId: number): Promise<ApiResponse<StaffWorkSchedule | null>> =>
    api.get(`staff-schedules/${userId}`).then(r => r.data),

  upsertSchedule: (userId: number, data: UpsertWorkScheduleRequest): Promise<ApiResponse<StaffWorkSchedule>> =>
    api.put(`staff-schedules/${userId}`, data).then(r => r.data),
};
