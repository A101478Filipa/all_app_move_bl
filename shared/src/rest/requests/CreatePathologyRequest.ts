import { z } from 'zod';
import { PathologyStatus } from '../../enums/pathologyStatus';

export const CreatePathologyRequest = z.object({
  name: z.string().min(1, "Pathology name is required"),
  description: z.string().nullable().optional(),
  diagnosisSite: z.string().nullable().optional(),
  diagnosisDate: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(PathologyStatus).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreatePathologyRequest = z.infer<typeof CreatePathologyRequest>;
