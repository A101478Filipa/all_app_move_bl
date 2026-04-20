import { api } from '@src/services/ApiService';
import { ApiResponse } from '@src/types/api';
import { ElderlyAbsence, CreateElderlyAbsenceRequest, UpdateElderlyAbsenceRequest } from 'moveplus-shared';

export type ElderlyAbsenceWithElderly = ElderlyAbsence & {
  elderly: { id: number; name: string; medicalId: number };
};

export const elderlyAbsenceApi = {
  getAbsences: (elderlyId: number): Promise<ApiResponse<ElderlyAbsence[]>> =>
    api.get(`elderly-absences/${elderlyId}`).then(r => r.data),

  getInstitutionAbsences: (): Promise<ApiResponse<ElderlyAbsenceWithElderly[]>> =>
    api.get('elderly-absences/institution').then(r => r.data),

  createAbsence: (elderlyId: number, data: CreateElderlyAbsenceRequest): Promise<ApiResponse<ElderlyAbsence>> =>
    api.post(`elderly-absences/${elderlyId}`, data).then(r => r.data),

  updateAbsence: (id: number, data: UpdateElderlyAbsenceRequest): Promise<ApiResponse<ElderlyAbsence>> =>
    api.put(`elderly-absences/entry/${id}`, data).then(r => r.data),

  deleteAbsence: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`elderly-absences/entry/${id}`).then(r => r.data),
};
