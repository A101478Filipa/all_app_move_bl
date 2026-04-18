import { z } from 'zod';
import { TimeOffType } from '../../enums/timeOffType';

export const UpsertWorkScheduleRequest = z.object({
  workDays: z
    .array(z.number().int().min(1).max(7))
    .min(0)
    .max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'endTime must be HH:MM'),
});

export type UpsertWorkScheduleRequest = z.infer<typeof UpsertWorkScheduleRequest>;

export const CreateTimeOffRequest = z.object({
  userId: z.number().int().positive(),
  type: z.nativeEnum(TimeOffType),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  note: z.string().optional().nullable(),
});

export type CreateTimeOffRequest = z.infer<typeof CreateTimeOffRequest>;

export const UpdateTimeOffRequest = z.object({
  type: z.nativeEnum(TimeOffType).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  note: z.string().optional().nullable(),
});

export type UpdateTimeOffRequest = z.infer<typeof UpdateTimeOffRequest>;

export const CreateElderlyAbsenceRequest = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().optional().nullable(),
});

export type CreateElderlyAbsenceRequest = z.infer<typeof CreateElderlyAbsenceRequest>;

export const UpdateElderlyAbsenceRequest = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  reason: z.string().optional().nullable(),
});

export type UpdateElderlyAbsenceRequest = z.infer<typeof UpdateElderlyAbsenceRequest>;
