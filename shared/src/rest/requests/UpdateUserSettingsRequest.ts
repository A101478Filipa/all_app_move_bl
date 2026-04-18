import { z } from 'zod';
import { Gender } from '../../enums/gender';

export const UpdateUserSettingsRequest = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  phone: z.string().max(20, 'Phone must be less than 20 characters').optional().or(z.literal('')),
  email: z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters').optional().or(z.literal('')),
  birthDate: z.string().refine((date) => {
    if (!date) return true;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed <= new Date();
  }, 'Invalid birth date or birth date cannot be in the future').optional().or(z.literal('')),
  gender: z.nativeEnum(Gender).optional().nullable(),
});

export type UpdateUserSettingsRequest = z.infer<typeof UpdateUserSettingsRequest>;