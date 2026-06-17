import { api , apiPublic} from '@src/services/ApiService';
import { ApiResponse } from 'moveplus-shared';

export interface ExternalAccessTokenResult {
  token: string;
  expiresAt: string;
  isExpired?: boolean;
  professionalName: string | null;
}

export interface ExternalElderlyPathology {
  id: number;
  name: string;
  status: string | null;
  diagnosisDate: string | null;
  notes: string | null;
}

export interface ExternalElderlyMedication {
  id: number;
  name: string;
  dosage: string | null;
  frequency: string | null;
  administration: string | null;
  status: string | null;
}

export interface ExternalElderlyMeasurement {
  id: number;
  type: string;
  value: number;
  unit: string;
  status: string | null;
  createdAt: string;
}

export interface ExternalElderlyFall {
  id: number;
  date: string;
  description: string | null;
  injured: boolean;
  injuryDescription: string | null;
}

export interface ExternalElderlySos {
  id: number;
  date: string;
  description: string | null;
  status: string | null;
}

export interface ExternalElderlyWound {
  id: number;
  location: string;
  status: string | null;
  lastUpdate: string;
}

export interface ExternalElderlyProfile {
  id: number;
  name: string;
  birthDate: string;
  gender: string;
  phone: string | null;
  emergencyContact: string | null;
  pathologies: ExternalElderlyPathology[];
  medications: ExternalElderlyMedication[];
  measurements: ExternalElderlyMeasurement[];
  recentFalls: ExternalElderlyFall[];
  recentSos: ExternalElderlySos[];
  recentWounds: ExternalElderlyWound[];
}

export interface ExternalVisitNote {
  notes: string;
  recommendations: string | null;
  submittedAt: string;
}

export interface ExternalProfileResponse {
  event: {
    id: number;
    title: string;
    type: string;
    startDate: string;
    endDate: string | null;
  };
  professional: { id: number; name: string; specialty: string | null } | null;
  expiresAt: string;
  elderly: ExternalElderlyProfile;
  visitNote: ExternalVisitNote | null;
}

export interface CreateExternalMeasurementBody {
  type: string;
  value: number;
  unit: string;
  status?: string | null;
  notes?: string | null;
}

export interface CreateExternalMedicationBody {
  name: string;
  activeIngredient?: string;
  dosage?: string;
  frequency?: string;
  administration?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  notes?: string;
}

export interface CreateExternalPathologyBody {
  name: string;
  description?: string | null;
  diagnosisSite?: string | null;
  diagnosisDate?: string | null;
  status?: string | null;
  notes?: string | null;
}

export interface CreateExternalFallBody {
  date: string;
  description?: string;
  injured: boolean;
  injuryDescription?: string;
  measuresTaken?: string;
}

export const externalAccessApi = {
  generateToken: (calendarEventId: number, expiresInDays?: number): Promise<ApiResponse<ExternalAccessTokenResult>> =>
    api.post('external-access/generate', { calendarEventId, expiresInDays }).then(r => r.data),

  getTokenForEvent: (calendarEventId: number): Promise<ApiResponse<ExternalAccessTokenResult | null>> =>
    api.get(`external-access/event/${calendarEventId}`).then(r => r.data),

  getProfileByToken: (token: string): Promise<ApiResponse<ExternalProfileResponse>> =>
    api.get(`external-access/${token}`).then(r => r.data),

  submitVisitNote: (token: string, body: { notes: string; recommendations?: string | null }): Promise<ApiResponse<ExternalVisitNote>> =>
    api.post(`external-access/${token}/submit`, body).then(r => r.data),

  getVisitNote: (calendarEventId: number): Promise<ApiResponse<ExternalVisitNote | null>> =>
    api.get(`external-access/visit-note/${calendarEventId}`).then(r => r.data),

  addMeasurement: (token: string, body: CreateExternalMeasurementBody): Promise<ApiResponse<ExternalElderlyMeasurement>> =>
    api.post(`external-access/${token}/measurements`, body).then(r => r.data),

  addMedication: (token: string, body: CreateExternalMedicationBody): Promise<ApiResponse<ExternalElderlyMedication>> =>
    api.post(`external-access/${token}/medications`, body).then(r => r.data),

  updateMedication: (token: string, medicationId: number, body: any) =>
    apiPublic.post(`external-access/${token}/medications/${medicationId}`, body).then(r => r.data),

  addPathology: (token: string, body: CreateExternalPathologyBody): Promise<ApiResponse<ExternalElderlyPathology>> =>
    api.post(`external-access/${token}/pathologies`, body).then(r => r.data),

  addFall: (token: string, body: CreateExternalFallBody): Promise<ApiResponse<ExternalElderlyFall>> =>
    api.post(`external-access/${token}/falls`, body).then(r => r.data),

  addSos: (token: string, body: { date: string; description?: string | null; status?: string | null }): Promise<ApiResponse<ExternalElderlySos>> =>
    api.post(`external-access/${token}/sos`, body).then(r => r.data),

  addWound: (token: string, body: { location: string; status?: string | null; lastUpdate: string }): Promise<ApiResponse<ExternalElderlyWound>> =>
    api.post(`external-access/${token}/wounds`, body).then(r => r.data),
};
