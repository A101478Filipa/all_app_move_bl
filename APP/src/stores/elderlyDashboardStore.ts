import { create } from 'zustand';
import { fallOccurrenceApi } from '@src/api/endpoints/fallOccurrences';
import { sosOccurrenceApi } from '@src/api/endpoints/sosOccurrences';
import ScreenState from '@src/constants/screenState';

type ElderlyDashboardState = {
  state: ScreenState;
  isReportingFall: boolean;
  isReportingSos: boolean;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  reportFall: (userId: number, description: string) => Promise<void>;
  reportSos: (userId: number) => Promise<void>;
};

export const useElderlyDashboardStore = create<ElderlyDashboardState>((set, get) => ({
  state: ScreenState.IDLE,
  isReportingFall: false,
  isReportingSos: false,
  fetch: async () => {
    set({ state: ScreenState.IDLE });
  },
  refresh: async () => {
    set({ state: ScreenState.IDLE });
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
