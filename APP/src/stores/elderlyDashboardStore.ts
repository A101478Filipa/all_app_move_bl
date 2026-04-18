import { create } from 'zustand';
import { DataAccessRequest } from '@src/api/endpoints/dataAccessRequest';
import { dataAccessRequestApi } from '@src/api/endpoints/dataAccessRequest';
import { fallOccurrenceApi } from '@src/api/endpoints/fallOccurrences';
import { sosOccurrenceApi } from '@src/api/endpoints/sosOccurrences';
import ScreenState from '@src/constants/screenState';

type ElderlyDashboardState = {
  pendingAccessRequests: DataAccessRequest[];
  state: ScreenState;
  isReportingFall: boolean;
  isReportingSos: boolean;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  removeRequest: (requestId: number) => void;
  reportFall: (userId: number, description: string) => Promise<void>;
  reportSos: (userId: number) => Promise<void>;
};

export const useElderlyDashboardStore = create<ElderlyDashboardState>((set, get) => ({
  pendingAccessRequests: [],
  state: ScreenState.LOADING,
  isReportingFall: false,
  isReportingSos: false,
  fetch: async () => {
    set({ state: ScreenState.LOADING });
    try {
      const response = await dataAccessRequestApi.getMyRequests();
      const pendingRequests = response.data.filter(req => req.status === 'PENDING');
      set({ pendingAccessRequests: pendingRequests, state: ScreenState.IDLE });
    } catch (err) {
      console.error('Error fetching access requests:', err);
      set({ state: ScreenState.ERROR });
    }
  },
  refresh: async () => {
    set({ state: ScreenState.REFRESHING });
    try {
      const response = await dataAccessRequestApi.getMyRequests();
      const pendingRequests = response.data.filter(req => req.status === 'PENDING');
      set({ pendingAccessRequests: pendingRequests, state: ScreenState.IDLE });
    } catch (err) {
      console.error('Error refreshing access requests:', err);
      set({ state: ScreenState.ERROR });
    }
  },
  removeRequest: (requestId: number) => {
    set((state) => ({
      pendingAccessRequests: state.pendingAccessRequests.filter(req => req.id !== requestId)
    }));
  },
  reportFall: async (userId: number, description: string) => {
    if (get().isReportingFall) return;

    set({ isReportingFall: true });
    try {
      await fallOccurrenceApi.createFallOccurrence(userId, {
        date: new Date(),
        description,
        injured: false,
      });
    } finally {
      set({ isReportingFall: false });
    }
  },
  reportSos: async (userId: number) => {
    if (get().isReportingSos) return;

    set({ isReportingSos: true });
    try {
      await sosOccurrenceApi.createSosOccurrence(userId, {
        date: new Date(),
      });
    } finally {
      set({ isReportingSos: false });
    }
  },
}));
