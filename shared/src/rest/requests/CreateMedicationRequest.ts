import { z } from 'zod';
import { MedicationStatus } from '../../enums/medicationStatus';

export const CreateMedicationRequest = z.object({
  name: z.string().min(1, "Medication name is required"),
  activeIngredient: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  administration: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.nativeEnum(MedicationStatus).optional(),
  notes: z.string().optional(),
});

export type CreateMedicationRequest = z.infer<typeof CreateMedicationRequest>;
