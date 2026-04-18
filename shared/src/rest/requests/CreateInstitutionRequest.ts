import { z } from 'zod';

export const CreateInstitutionRequest = z.object({
  name: z.string().min(1, 'Institution name is required'),
  nickname: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export type CreateInstitutionRequest = z.infer<typeof CreateInstitutionRequest>;
