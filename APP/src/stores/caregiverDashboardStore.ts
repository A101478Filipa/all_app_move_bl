import { create } from 'zustand';
import { DataAccessRequest } from '@src/api/endpoints/dataAccessRequest';
import { dataAccessRequestApi } from '@src/api/endpoints/dataAccessRequest';
import ScreenState from '@src/constants/screenState';

type CaregiverDashboardState = {
  pendingAccessRequests: DataAccessRequest[];
  state: ScreenState;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  removeRequest: (requestId: number) => void;
};

export const useCaregiverDashboardStore = create<CaregiverDashboardState>((set, get) => ({
  pendingAccessRequests: [],
  state: ScreenState.LOADING,
  fetch: async () => {
    set({ state: ScreenState.LOADING });
    try {
      const response = await dataAccessRequestApi.getMyRequests();
      const pendingRequests = response.data.filter(req => req.status === 'PENDING');
      set({ pendingAccessRequests: pendingRequests, state: ScreenState.IDLE });
    } catch (err) {
      console.error('Error fetching access requests for caregiver:', err);
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
      console.error('Error refreshing access requests for caregiver:', err);
      set({ state: ScreenState.ERROR });
    }
  },
  removeRequest: (requestId: number) => {
    set((state) => ({
      pendingAccessRequests: state.pendingAccessRequests.filter(req => req.id !== requestId)
    }));
  },
}));
