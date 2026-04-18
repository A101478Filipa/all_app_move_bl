import { api } from '@src/services/ApiService';
import { Institution, FallOccurrence, Caregiver, Elderly, InstitutionAdmin, TimelineActivity, CreateInstitutionRequest, Clinician } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

type InstitutionUsers = {
  elderly: Elderly[];
  caregivers: Caregiver[];
  admins: InstitutionAdmin[];
  clinicians: Clinician[];
};

export const institutionApi = {
  getInstitutions: (): Promise<ApiResponse<Institution[]>> =>
    api.get('/institutions').then(response => response.data),

  getFallOccurrences: (): Promise<ApiResponse<FallOccurrence[]>> =>
    api.get('institutions/fall-occurrences').then(response => response.data),

  getTimeline: (): Promise<ApiResponse<TimelineActivity[]>> =>
    api.get('institutions/timeline').then(response => response.data),

  getInstitutionUsers: (institutionId?: number): Promise<ApiResponse<InstitutionUsers>> => {
    const endpoint = institutionId ? `/institutions/${institutionId}/users` : '/institutions/users';
    return api.get(endpoint).then(response => response.data);
  },

  searchInstitutions: (query: string): Promise<ApiResponse<Institution[]>> =>
    api.get('/institutions', { params: { name: query } }).then(response => response.data),

  searchInstitutionUsers: (query: string, institutionId?: number): Promise<ApiResponse<InstitutionUsers>> => {
    const endpoint = institutionId ? `/institutions/${institutionId}/users` : '/institutions/users';
    return api.get(endpoint, { params: { name: query } }).then(response => response.data);
  },

  createInstitution: (data: CreateInstitutionRequest): Promise<ApiResponse<Institution>> =>
    api.post('/institutions', data).then(response => response.data),
};
