import { z } from 'zod';

export const HandleSosOccurrenceRequest = z.object({
  wasActualFall: z.boolean().optional().nullable(),
  notes: z.string().optional(),
  isFalseAlarm: z.boolean().optional(),
});

export type HandleSosOccurrenceRequest = z.infer<typeof HandleSosOccurrenceRequest>;
