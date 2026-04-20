import { z } from 'zod';

export const HandleSosOccurrenceRequest = z.object({
  wasActualFall: z.boolean().optional().nullable(),
  notes: z.string().optional(),
  isFalseAlarm: z.boolean().optional(),
  recovery: z.string().optional(),
  preActivity: z.string().optional(),
  postActivity: z.string().optional(),
  direction: z.string().optional(),
  environment: z.string().optional(),
  injured: z.boolean().optional(),
  injuryDescription: z.string().optional(),
  injuryPhotoUrl: z.string().optional(),
  measuresTaken: z.string().optional(),
});

export type HandleSosOccurrenceRequest = z.infer<typeof HandleSosOccurrenceRequest>;
