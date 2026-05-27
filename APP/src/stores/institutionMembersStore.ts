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
    allUsers: Users;
    state: ScreenState;
    sortOption: MemberSortOption;
    sortDirection: SortDirection;
    fetchUsers: (institutionId?: number) => Promise<void>;
    refreshUsers: (institutionId?: number) => Promise<void>;
    searchUsers: (query: string, institutionId?: number) => Promise<void>;
    setSortOption: (option: MemberSortOption) => void;
    sortMembers: (members: InstitutionMember[], option: MemberSortOption, direction: SortDirection) => InstitutionMember[];
};

const emptyUsers: Users = { elderly: [], caregivers: [], admins: [], clinicians: [] };

function filterUsers(all: Users, query: string, sortMembers: InstitutionMembersState['sortMembers'], sortOption: MemberSortOption, sortDirection: SortDirection): Users {
  const q = query.trim().toLowerCase();
  const isNumeric = /^\d+$/.test(q);
  const numericId = isNumeric ? parseInt(q) : undefined;

  const matchName = (name: string) => name.toLowerCase().includes(q);

  const elderly = sortMembers(
    all.elderly.filter(e => matchName(e.name) || (numericId !== undefined && e.medicalId === numericId)),
    sortOption, sortDirection
  ) as Elderly[];
  const caregivers = sortMembers(all.caregivers.filter(c => matchName(c.name)), sortOption, sortDirection) as Caregiver[];
  const admins = sortMembers(all.admins.filter(a => matchName(a.name)), sortOption, sortDirection) as InstitutionAdmin[];
  const clinicians = sortMembers(all.clinicians.filter(c => matchName(c.name)), sortOption, sortDirection) as Clinician[];

  return { elderly, caregivers, admins, clinicians };
}

export const useInstitutionMembersStore = create<InstitutionMembersState>((set, get) => ({
  users: emptyUsers,
  allUsers: emptyUsers,
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
    const { allUsers, sortOption, sortDirection, sortMembers } = get();
    const newDirection = option === sortOption
      ? (sortDirection === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC)
      : SortDirection.ASC;

    const sortedAll = {
      elderly: sortMembers(allUsers.elderly, option, newDirection) as Elderly[],
      caregivers: sortMembers(allUsers.caregivers, option, newDirection) as Caregiver[],
      admins: sortMembers(allUsers.admins, option, newDirection) as InstitutionAdmin[],
      clinicians: sortMembers(allUsers.clinicians, option, newDirection) as Clinician[],
    };

    set({
      sortOption: option,
      sortDirection: newDirection,
      allUsers: sortedAll,
      users: sortedAll,
    });
  },

  fetchUsers: async (institutionId?: number) => {
    set({ state: ScreenState.LOADING });
    try {
      const response = await institutionApi.getInstitutionUsers(institutionId);
      const data = response.data;
      const { sortOption, sortDirection, sortMembers } = get();

      const sortedData: Users = {
        elderly: sortMembers(data.elderly, sortOption, sortDirection) as Elderly[],
        caregivers: sortMembers(data.caregivers, sortOption, sortDirection) as Caregiver[],
        admins: sortMembers(data.admins, sortOption, sortDirection) as InstitutionAdmin[],
        clinicians: sortMembers(data.clinicians ?? [], sortOption, sortDirection) as Clinician[],
      };

      set({ users: sortedData, allUsers: sortedData, state: ScreenState.IDLE });
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

      const sortedData: Users = {
        elderly: sortMembers(data.elderly, sortOption, sortDirection) as Elderly[],
        caregivers: sortMembers(data.caregivers, sortOption, sortDirection) as Caregiver[],
        admins: sortMembers(data.admins, sortOption, sortDirection) as InstitutionAdmin[],
        clinicians: sortMembers(data.clinicians ?? [], sortOption, sortDirection) as Clinician[],
      };

      set({ users: sortedData, allUsers: sortedData, state: ScreenState.IDLE });
    } catch (error) {
      console.error('Error fetching institution members:', error);
      set({ state: ScreenState.ERROR });
    }
  },

  searchUsers: async (query: string, _institutionId?: number) => {
    const { allUsers, sortOption, sortDirection, sortMembers } = get();
    if (!query.trim()) return;
    set({ users: filterUsers(allUsers, query, sortMembers, sortOption, sortDirection) });
  },
}));
