import { DataAccessRequestStatus } from '../enums/dataAccessRequestStatus';

export interface DataAccessRequest {
  id: number;
  clinicianId: number;
  elderlyId: number;
  status: DataAccessRequestStatus;
  requestedAt: Date;
  respondedAt?: Date;
  expiresAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataAccessRequestWithRelations extends DataAccessRequest {
  clinician?: any;
  elderly?: any;
}
