import { z } from 'zod';
import { PathologyStatus } from '../../enums/pathologyStatus';

export const UpdatePathologyRequest = z.object({
  description: z.string().optional(),
  status: z.nativeEnum(PathologyStatus).optional(),
  notes: z.string().optional(),
});

export type UpdatePathologyRequest = z.infer<typeof UpdatePathologyRequest>;
