import { DataAccessRequestStatus } from '../../enums/dataAccessRequestStatus';

export interface SearchElderlyResponse {
  id: number;
  medicalId: number;
  name: string;
  birthDate: Date;
  gender: string;
  user: {
    avatarUrl?: string;
  };
  hasFullAccess: boolean;
  accessRequest?: {
    id: number;
    status: DataAccessRequestStatus;
    requestedAt: Date;
    respondedAt?: Date;
  } | null;
}
