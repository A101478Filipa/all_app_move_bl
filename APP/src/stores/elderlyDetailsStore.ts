import { create } from 'zustand';
import { elderlyApi } from '@src/api/endpoints/elderly';
import { handleApiError } from '@src/api/utils';
import ScreenState from '@src/constants/screenState';
import { Elderly, CreateMedicationRequest, UpdateMedicationRequest, UpdatePathologyRequest, UpdateElderlyRequest } from 'moveplus-shared';
import { ErrorResponse } from '@src/types/api';

type ElderlyDetailsState = {
  elderly: Elderly | null;
  state: ScreenState;
  error: ErrorResponse | null;
  fetchElderly: (elderlyId: number) => Promise<void>;
  refreshElderly: (elderlyId: number) => Promise<void>;
  addMedication: (elderlyId: number, medicationData: CreateMedicationRequest) => Promise<void>;
  updateMedication: (elderlyId: number, medicationId: number, medicationData: UpdateMedicationRequest) => Promise<void>;
  updateElderly: (elderlyId: number, data: UpdateElderlyRequest) => Promise<void>;
  addMeasurement: (elderlyId: number, measurementData: any) => Promise<void>;
  addPathology: (elderlyId: number, pathologyData: any) => Promise<void>;
  updatePathology: (elderlyId: number, pathologyId: number, pathologyData: UpdatePathologyRequest) => Promise<void>;
  clearData: () => void;
  clearError: () => void;
};

export const useElderlyDetailsStore = create<ElderlyDetailsState>((set, get) => ({
  elderly: null,
  state: ScreenState.IDLE,
  error: null,

  fetchElderly: async (elderlyId: number) => {
    set({ state: ScreenState.LOADING, error: null });
    try {
      const response = await elderlyApi.getElderly(elderlyId);
      const elderly = response.data;
      set({ elderly, state: ScreenState.IDLE });
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('Error fetching elderly details:', apiError);
      set({ state: ScreenState.ERROR, error: apiError });
    }
  },

  refreshElderly: async (elderlyId: number) => {
    set({ state: ScreenState.REFRESHING, error: null });
    try {
      const response = await elderlyApi.getElderly(elderlyId);
      const elderly = response.data;
      set({ elderly, state: ScreenState.IDLE });
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('Error refreshing elderly details:', apiError);
      set({ state: ScreenState.ERROR, error: apiError });
    }
  },

  addMedication: async (elderlyId: number, medicationData: CreateMedicationRequest) => {
    try {
      await elderlyApi.addMedication(elderlyId, medicationData);

      const { refreshElderly } = get();
      await refreshElderly(elderlyId);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('Error adding medication:', apiError);
      throw apiError;
    }
  },

  updateMedication: async (elderlyId: number, medicationId: number, medicationData: UpdateMedicationRequest) => {
    try {
      await elderlyApi.updateMedication(elderlyId, medicationId, medicationData);

      const { refreshElderly } = get();
      await refreshElderly(elderlyId);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('Error updating medication:', apiError);
      throw apiError;
    }
  },

  addMeasurement: async (elderlyId: number, measurementData: any) => {
    try {
      await elderlyApi.addMeasurement(elderlyId, measurementData);

      const { refreshElderly } = get();
      await refreshElderly(elderlyId);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('Error adding measurement:', apiError);
      throw apiError;
    }
  },

  addPathology: async (elderlyId: number, pathologyData: any) => {
    try {
      await elderlyApi.addPathology(elderlyId, pathologyData);

      const { refreshElderly } = get();
      await refreshElderly(elderlyId);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('Error adding pathology:', apiError);
      throw apiError;
    }
  },

  updatePathology: async (elderlyId: number, pathologyId: number, pathologyData: UpdatePathologyRequest) => {
    try {
      await elderlyApi.updatePathology(elderlyId, pathologyId, pathologyData);

      const { refreshElderly } = get();
      await refreshElderly(elderlyId);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('Error updating pathology:', apiError);
      throw apiError;
    }
  },

  updateElderly: async (elderlyId: number, data: UpdateElderlyRequest) => {
    try {
      const response = await elderlyApi.updateElderly(elderlyId, data);
      set({ elderly: response.data });
    } catch (error) {
      const apiError = handleApiError(error);
      console.error('Error updating elderly:', apiError);
      throw apiError;
    }
  },

  clearData: () => {
    set({ elderly: null, state: ScreenState.IDLE, error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
