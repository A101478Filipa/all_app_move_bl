import { institutionApi } from '@src/api/endpoints/institution';
import ScreenState from '@src/constants/screenState';
import { Institution } from 'moveplus-shared';
import { create } from 'zustand';

type InstitutionListState = {
  institutions: Institution[];
  state: ScreenState;
  fetchInstitutions: () => Promise<void>;
  refreshInstitutions: () => Promise<void>;
  searchInstitutions: (query: string) => Promise<void>;
};

export const useInstitutionListStore = create<InstitutionListState>((set) => ({
  institutions: [],
  state: ScreenState.IDLE,

  fetchInstitutions: async () => {
    set({ state: ScreenState.LOADING });
    try {
      const response = await institutionApi.getInstitutions();
      const institutions = response.data;
      set({ institutions, state: ScreenState.IDLE });
    } catch (error) {
      console.error('Error fetching institutions:', error);
      set({ state: ScreenState.ERROR });
    }
  },

  refreshInstitutions: async () => {
    set({ state: ScreenState.REFRESHING });
    try {
      const response = await institutionApi.getInstitutions();
      const institutions = response.data;
      set({ institutions, state: ScreenState.IDLE });
    } catch (error) {
      console.error('Error refreshing institutions:', error);
      set({ state: ScreenState.ERROR });
    }
  },

  searchInstitutions: async (query: string) => {
    set({ state: ScreenState.LOADING });
    try {
      const response = await institutionApi.searchInstitutions(query);
      const institutions = response.data;
      set({ institutions, state: ScreenState.IDLE });
    } catch (error) {
      console.error('Error searching institutions:', error);
      set({ state: ScreenState.ERROR });
    }
  },
}));
