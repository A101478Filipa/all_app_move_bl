import { Caregiver } from './users/caregiver';
import { Elderly } from './users/elderly';
import { InstitutionAdmin } from './users/institutionAdmin';

export interface SosOccurrence {
  id: number;
  elderlyId: number;
  handlerUserId?: number | null;
  date: Date;
  wasActualFall?: boolean | null;
  notes?: string | null;
  isFalseAlarm: boolean;
  createdAt: Date;

  // Relationships
  elderly: Elderly;
  handler?: Caregiver | InstitutionAdmin | null;
}
