import { z } from 'zod';
import { MedicationStatus } from '../../enums/medicationStatus';

export const UpdateMedicationRequest = z.object({
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  administration: z.string().optional(),
  endDate: z.coerce.date().optional(),
  status: z.nativeEnum(MedicationStatus).optional(),
  notes: z.string().optional(),
});

export type UpdateMedicationRequest = z.infer<typeof UpdateMedicationRequest>;