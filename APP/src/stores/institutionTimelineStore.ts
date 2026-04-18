import { create } from 'zustand';
import { TimelineActivity, TimelineSection } from 'moveplus-shared';
import { institutionApi } from '@src/api/endpoints/institution';
import ScreenState from '@src/constants/screenState';
import { formatDate } from '@src/utils/Date';

type InstitutionTimelineState = {
  sections: TimelineSection[];
  state: ScreenState;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
};

const buildTimelineSections = (activities: TimelineActivity[]): TimelineSection[] => {
  return Object.values(
    activities.reduce<Record<string, { title: string, data: TimelineActivity[] }>>((acc, item) => {
      const day = formatDate(item.createdAt, 'YYYY-MM-DD');
      if (!acc[day]) acc[day] = { title: day, data: [] };
      acc[day].data.push(item);
      return acc;
    }, {})
  ).sort((a, b) => (a.title < b.title ? 1 : -1));
}

export const useInstitutionTimelineStore = create<InstitutionTimelineState>((set) => ({
  sections: [],
  state: ScreenState.LOADING,
  fetch: async () => {
    set({ state: ScreenState.LOADING });
    try {
      const response = await institutionApi.getTimeline();
      const sections = buildTimelineSections(response.data);
      set({ sections, state: ScreenState.IDLE });
    } catch (err) {
      console.error(err);
      set({ state: ScreenState.ERROR });
    }
  },
  refresh: async () => {
    set({ state: ScreenState.REFRESHING });
    try {
      const response = await institutionApi.getTimeline();
      const sections = buildTimelineSections(response.data);
      set({ sections, state: ScreenState.IDLE });
    } catch (err) {
      console.error(err);
      set({ state: ScreenState.ERROR });
    }
  },
}));