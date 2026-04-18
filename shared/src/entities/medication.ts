import { MedicationStatus } from '../enums/medicationStatus';

export interface Medication {
  id: number;
  elderlyId: number;
  registeredById: number;
  name: string;
  activeIngredient?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  administration?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: MedicationStatus | null;
  notes?: string | null;
  createdAt: Date;
}