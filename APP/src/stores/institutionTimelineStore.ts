import { create } from 'zustand';
import { TimelineActivity, TimelineSection } from 'moveplus-shared';
import { institutionApi } from '@src/api/endpoints/institution';
import ScreenState from '@src/constants/screenState';
import { formatDate } from '@src/utils/Date';

export type TimelineFilterMode = 'day' | 'month' | null;

type InstitutionTimelineState = {
  allActivities: TimelineActivity[];
  sections: TimelineSection[];
  filterMode: TimelineFilterMode;
  filterDate: string | null; // YYYY-MM-DD for day, YYYY-MM for month
  state: ScreenState;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  setFilter: (date: string, mode: 'day' | 'month') => void;
  clearFilter: () => void;
};

const buildTimelineSections = (
  activities: TimelineActivity[],
  filterDate: string | null,
  filterMode: TimelineFilterMode
): TimelineSection[] => {
  const todayStr = formatDate(new Date(), 'YYYY-MM-DD');
  const filtered = activities.filter(item => {
    const day = formatDate(item.createdAt, 'YYYY-MM-DD');
    if (day > todayStr) return false;
    if (!filterDate || !filterMode) return true;
    if (filterMode === 'day') return day === filterDate;
    if (filterMode === 'month') return day.startsWith(filterDate);
    return true;
  });
  return Object.values(
    filtered.reduce<Record<string, { title: string, data: TimelineActivity[] }>>((acc, item) => {
      const day = formatDate(item.createdAt, 'YYYY-MM-DD');
      if (!acc[day]) acc[day] = { title: day, data: [] };
      acc[day].data.push(item);
      return acc;
    }, {})
  ).sort((a, b) => (a.title < b.title ? 1 : -1));
};

export const useInstitutionTimelineStore = create<InstitutionTimelineState>((set, get) => ({
  allActivities: [],
  sections: [],
  filterMode: null,
  filterDate: null,
  state: ScreenState.LOADING,
  fetch: async () => {
    set({ state: ScreenState.LOADING });
    try {
      const response = await institutionApi.getTimeline();
      const { filterDate, filterMode } = get();
      const sections = buildTimelineSections(response.data, filterDate, filterMode);
      set({ allActivities: response.data, sections, state: ScreenState.IDLE });
    } catch (err) {
      console.error(err);
      set({ state: ScreenState.ERROR });
    }
  },
  refresh: async () => {
    set({ state: ScreenState.REFRESHING });
    try {
      const response = await institutionApi.getTimeline();
      const { filterDate, filterMode } = get();
      const sections = buildTimelineSections(response.data, filterDate, filterMode);
      set({ allActivities: response.data, sections, state: ScreenState.IDLE });
    } catch (err) {
      console.error(err);
      set({ state: ScreenState.ERROR });
    }
  },
  setFilter: (date, mode) => {
    const { allActivities } = get();
    const sections = buildTimelineSections(allActivities, date, mode);
    set({ filterDate: date, filterMode: mode, sections });
  },
  clearFilter: () => {
    const { allActivities } = get();
    const sections = buildTimelineSections(allActivities, null, null);
    set({ filterDate: null, filterMode: null, sections });
  },
}));