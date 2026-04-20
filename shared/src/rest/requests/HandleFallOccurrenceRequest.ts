import { z } from 'zod';

export const HandleFallOccurrenceRequest = z.object({
  description: z.string().optional(),
  recovery: z.string().optional(),
  preActivity: z.string().optional(),
  postActivity: z.string().optional(),
  direction: z.string().optional(),
  environment: z.string().optional(),
  injured: z.boolean(),
  injuryDescription: z.string().optional(),
  injuryPhotoUrl: z.string().optional(),
  measuresTaken: z.string().optional(),
  isFalseAlarm: z.boolean().optional(),
});

export type HandleFallOccurrenceRequest = z.infer<typeof HandleFallOccurrenceRequest>;