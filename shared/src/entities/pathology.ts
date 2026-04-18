import { PathologyStatus } from '../enums/pathologyStatus';

export interface Pathology {
  id: number;
  elderlyId: number;
  registeredById: number;
  name: string;
  description?: string | null;
  diagnosisSite?: string | null;
  diagnosisDate?: string | null;
  diagnosedAt?: string | null;
  status?: PathologyStatus | null;
  notes?: string | null;
  createdAt: Date;
}