import { create } from 'zustand';
import { FallOccurrence, SosOccurrence } from 'moveplus-shared';
import { institutionApi } from '@src/api/endpoints/institution';
import { sosOccurrenceApi } from '@src/api/endpoints/sosOccurrences';
import ScreenState from '@src/constants/screenState';
import { formatDate } from '@src/utils/Date';

type DashboardSection = {
  title: string;
  data: FallOccurrence[];
}

type InstitutionDashboardState = {
  sections: DashboardSection[];
  sosOccurrences: SosOccurrence[];
  state: ScreenState;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
};

const buildDashboardSections = (occurrences: FallOccurrence[]): DashboardSection[] => {
  return Object.values(
    occurrences.reduce<Record<string, { title: string, data: FallOccurrence[] }>>((acc, item) => {
      const day = formatDate(item.date, 'YYYY-MM-DD');
      if (!acc[day]) acc[day] = { title: day, data: [] };
      acc[day].data.push(item);
      return acc;
    }, {})
  ).sort((a, b) => (a.title < b.title ? 1 : -1));
}

export const useInstitutionDashboardStore = create<InstitutionDashboardState>((set) => ({
  sections: [],
  sosOccurrences: [],
  state: ScreenState.LOADING,
  fetch: async () => {
    set({ state: ScreenState.LOADING });
    try {
      const [fallResponse, sosResponse] = await Promise.all([
        institutionApi.getFallOccurrences(),
        sosOccurrenceApi.getInstitutionSosOccurrences(),
      ]);
      const sections = buildDashboardSections(fallResponse.data);
      set({ sections, sosOccurrences: sosResponse.data, state: ScreenState.IDLE });
    } catch (err) {
      console.error(err);
      set({ state: ScreenState.ERROR });
    }
  },
  refresh: async () => {
    set({ state: ScreenState.REFRESHING });
    try {
      const [fallResponse, sosResponse] = await Promise.all([
        institutionApi.getFallOccurrences(),
        sosOccurrenceApi.getInstitutionSosOccurrences(),
      ]);
      const sections = buildDashboardSections(fallResponse.data);
      set({ sections, sosOccurrences: sosResponse.data, state: ScreenState.IDLE });
    } catch (err) {
      console.error(err);
      set({ state: ScreenState.ERROR });
    }
  },
}));
