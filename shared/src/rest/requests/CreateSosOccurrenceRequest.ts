import { z } from 'zod';

export const CreateSosOccurrenceRequest = z.object({
  date: z.coerce.date(),
  notes: z.string().optional(),
});

export type CreateSosOccurrenceRequest = z.infer<typeof CreateSosOccurrenceRequest>;
