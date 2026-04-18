import { z } from 'zod';

export const CreateFallOccurrenceRequest = z.object({
  detectionId: z.coerce.number().int().positive().optional(),
  date: z.coerce.date(),
  description: z.string().optional(),
  recovery: z.string().optional(),
  preActivity: z.string().optional(),
  postActivity: z.string().optional(),
  direction: z.string().optional(),
  environment: z.string().optional(),
  injured: z.boolean(),
  injuryDescription: z.string().optional(),
  measuresTaken: z.string().optional(),
});

export type CreateFallOccurrenceRequest = z.infer<typeof CreateFallOccurrenceRequest>;