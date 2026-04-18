import { api } from '@src/services/ApiService';
import { Elderly, CreateMedicationRequest, UpdateMedicationRequest, UpdatePathologyRequest, SearchElderlyResponse, Measurement, MeasurementType, UpdateElderlyRequest } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const elderlyApi = {
  getElderly: (elderlyId: number): Promise<ApiResponse<Elderly>> =>
    api.get(`elderly/${elderlyId}`).then(response => response.data),

  updateElderly: (elderlyId: number, data: UpdateElderlyRequest): Promise<ApiResponse<Elderly>> =>
    api.put(`elderly/${elderlyId}`, data).then(response => response.data),

  searchByMedicalId: (medicalId: number): Promise<ApiResponse<SearchElderlyResponse>> =>
    api.get(`elderly/search/by-medical-id?medicalId=${medicalId}`).then(response => response.data),

  addMedication: (elderlyId: number, medicationData: CreateMedicationRequest): Promise<ApiResponse> =>
    api.post(`elderly/${elderlyId}/medications`, medicationData).then(response => response.data),

  updateMedication: (elderlyId: number, medicationId: number, medicationData: UpdateMedicationRequest): Promise<ApiResponse> =>
    api.put(`elderly/${elderlyId}/medications/${medicationId}`, medicationData).then(response => response.data),

  addMeasurement: (elderlyId: number, measurementData: any): Promise<ApiResponse> =>
    api.post(`elderly/${elderlyId}/measurements`, { ...measurementData, elderlyId }).then(response => response.data),

  getMeasurementsByType: (elderlyId: number, type: MeasurementType): Promise<ApiResponse<Measurement[]>> =>
    api.get(`elderly/${elderlyId}/measurements?type=${type}`).then(response => response.data),

  addPathology: (elderlyId: number, pathologyData: any): Promise<ApiResponse> =>
    api.post(`elderly/${elderlyId}/pathologies`, {
      ...pathologyData,
      elderlyId,
      registeredById: 1, // TODO: Get from auth context
    }),

  updatePathology: (elderlyId: number, pathologyId: number, pathologyData: UpdatePathologyRequest): Promise<ApiResponse> =>
    api.put(`elderly/${elderlyId}/pathologies/${pathologyId}`, pathologyData).then(response => response.data),
};
