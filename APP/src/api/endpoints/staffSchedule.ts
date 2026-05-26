import { api } from '@src/services/ApiService';
import { ApiResponse } from '@src/types/api';
import { StaffWorkSchedule, StaffTimeOff, UpsertWorkScheduleRequest } from 'moveplus-shared';

export type StaffScheduleSummary = {
  userId: number;
  name: string;
  role: string;
  schedule: StaffWorkSchedule | null;
  timeOffs: Pick<StaffTimeOff, 'userId' | 'type' | 'startDate' | 'endDate' | 'status'>[];
};

export const staffScheduleApi = {
  getSchedule: (userId: number): Promise<ApiResponse<StaffWorkSchedule | null>> =>
    api.get(`staff-schedules/${userId}`).then(r => r.data),

  upsertSchedule: (userId: number, data: UpsertWorkScheduleRequest): Promise<ApiResponse<StaffWorkSchedule>> =>
    api.put(`staff-schedules/${userId}`, data).then(r => r.data),

  getInstitutionSchedules: (): Promise<ApiResponse<StaffScheduleSummary[]>> =>
    api.get('staff-schedules/institution').then(r => r.data),
};
