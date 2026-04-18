import ScreenState from '@src/constants/screenState';
import { institutionApi } from '@src/api/endpoints/institution';
import { Caregiver, Clinician, Elderly, InstitutionAdmin, InstitutionMember } from 'moveplus-shared';
import { create } from 'zustand';
import { MemberSortOption, SortDirection } from '@src/types/InstitutionSortOption';
import { calculateAge } from '@src/utils/Date';
import { calculateFallRiskScore } from '@src/utils/fallRiskCalculator';

type Users = {
  elderly: Elderly[];
  caregivers: Caregiver[];
  admins: InstitutionAdmin[];
  clinicians: Clinician[];
}

type InstitutionMembersState = {
    users: Users;
    state: ScreenState;
    sortOption: MemberSortOption;
    sortDirection: SortDirection;
    fetchUsers: (institutionId?: number) => Promise<void>;
    refreshUsers: (institutionId?: number) => Promise<void>;
    searchUsers: (query: string, institutionId?: number) => Promise<void>;
    setSortOption: (option: MemberSortOption) => void;
    sortMembers: (members: InstitutionMember[], option: MemberSortOption, direction: SortDirection) => InstitutionMember[];
};

export const useInstitutionMembersStore = create<InstitutionMembersState>((set, get) => ({
  users: {
    elderly: [],
    caregivers: [],
    admins: [],    clinicians: [],  },
  state: ScreenState.IDLE,
  sortOption: MemberSortOption.NAME,
  sortDirection: SortDirection.ASC,

  sortMembers: (members: InstitutionMember[], option: MemberSortOption, direction: SortDirection) => {
    const sorted = [...members];
    const isAscending = direction === SortDirection.ASC;

    switch (option) {
      case MemberSortOption.NAME:
        return sorted.sort((a, b) =>
          isAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );
      case MemberSortOption.AGE:
        return sorted.sort((a, b) =>
          isAscending
            ? calculateAge(a.birthDate) - calculateAge(b.birthDate)
            : calculateAge(b.birthDate) - calculateAge(a.birthDate)
        );
      case MemberSortOption.ROLE:
        return sorted.sort((a, b) =>
          isAscending
            ? a.user.role.localeCompare(b.user.role)
            : b.user.role.localeCompare(a.user.role)
        );
      case MemberSortOption.FALL_RISK:
        // Only applies to Elderly members
        return sorted.sort((a, b) => {
          const riskA = calculateFallRiskScore(a as Elderly);
          const riskB = calculateFallRiskScore(b as Elderly);
          return isAscending ? riskA - riskB : riskB - riskA;
        });
      case MemberSortOption.FLOOR:
        return sorted.sort((a, b) => {
          const floorA = (a as Elderly).floor ?? 0;
          const floorB = (b as Elderly).floor ?? 0;
          return isAscending ? floorA - floorB : floorB - floorA;
        });
      default:
        return sorted;
    }
  },

  setSortOption: (option: MemberSortOption) => {
    const { users, sortOption, sortDirection, sortMembers } = get();
    const newDirection = option === sortOption
      ? (sortDirection === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC)
      : SortDirection.ASC;

    const sortedElderly = sortMembers(users.elderly, option, newDirection) as Elderly[];
    const sortedCaregivers = sortMembers(users.caregivers, option, newDirection) as Caregiver[];
    const sortedAdmins = sortMembers(users.admins, option, newDirection) as InstitutionAdmin[];
    const sortedClinicians = sortMembers(users.clinicians, option, newDirection) as Clinician[];

    set({
      sortOption: option,
      sortDirection: newDirection,
      users: {
        elderly: sortedElderly,
        caregivers: sortedCaregivers,
        admins: sortedAdmins,
        clinicians: sortedClinicians,
      }
    });
  },

  fetchUsers: async (institutionId?: number) => {
    set({ state: ScreenState.LOADING });
    try {
      const response = await institutionApi.getInstitutionUsers(institutionId);
      const data = response.data;
      const { sortOption, sortDirection, sortMembers } = get();

      const sortedData = {
        elderly: sortMembers(data.elderly, sortOption, sortDirection) as Elderly[],
        caregivers: sortMembers(data.caregivers, sortOption, sortDirection) as Caregiver[],
        admins: sortMembers(data.admins, sortOption, sortDirection) as InstitutionAdmin[],
        clinicians: sortMembers(data.clinicians ?? [], sortOption, sortDirection) as Clinician[],
      };

      set({ users: sortedData, state: ScreenState.IDLE });
    } catch (error) {
      console.error('Error fetching institution members:', error);
      set({ state: ScreenState.ERROR });
    }
  },

  refreshUsers: async (institutionId?: number) => {
    set({ state: ScreenState.REFRESHING });
    try {
      const response = await institutionApi.getInstitutionUsers(institutionId);
      const data = response.data;
      const { sortOption, sortDirection, sortMembers } = get();

      const sortedData = {
        elderly: sortMembers(data.elderly, sortOption, sortDirection) as Elderly[],
        caregivers: sortMembers(data.caregivers, sortOption, sortDirection) as Caregiver[],
        admins: sortMembers(data.admins, sortOption, sortDirection) as InstitutionAdmin[],
        clinicians: sortMembers(data.clinicians ?? [], sortOption, sortDirection) as Clinician[],
      };

      set({ users: sortedData, state: ScreenState.IDLE });
    } catch (error) {
      console.error('Error fetching institution members:', error);
      set({ state: ScreenState.ERROR });
    }
  },

  searchUsers: async (query: string, institutionId?: number) => {
    set({ state: ScreenState.LOADING });
    try {
      const response = await institutionApi.searchInstitutionUsers(query, institutionId);
      const data = response.data;
      const { sortOption, sortDirection, sortMembers } = get();

      const sortedData = {
        elderly: sortMembers(data.elderly, sortOption, sortDirection) as Elderly[],
        caregivers: sortMembers(data.caregivers, sortOption, sortDirection) as Caregiver[],
        admins: sortMembers(data.admins, sortOption, sortDirection) as InstitutionAdmin[],
        clinicians: sortMembers(data.clinicians ?? [], sortOption, sortDirection) as Clinician[],
      };

      set({ users: sortedData, state: ScreenState.IDLE });
    } catch (error) {
      console.error('Error fetching institution members:', error);
      set({ state: ScreenState.ERROR });
    }
  },
}));
