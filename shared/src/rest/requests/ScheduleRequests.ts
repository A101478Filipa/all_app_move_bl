import { z } from 'zod';
import { TimeOffType } from '../../enums/timeOffType';
import { TimeOffStatus } from '../../enums/timeOffStatus';

// Renomeado para UpsertWorkScheduleSlot para não colidir com o modelo da BD ──
export const UpsertWorkScheduleSlot = z.object({
  dayIso: z.number().int().min(1).max(7), // 1 = Seg, 7 = Dom
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'endTime must be HH:MM'),
  isActive: z.boolean(), // Define se trabalha ou folga nesse dia
});

export type UpsertWorkScheduleSlot = z.infer<typeof UpsertWorkScheduleSlot>;

export const UpsertWorkScheduleRequest = z.object({
  slots: z.array(UpsertWorkScheduleSlot).min(1).max(7), // Usa o tipo corrigido aqui
});

export type UpsertWorkScheduleRequest = z.infer<typeof UpsertWorkScheduleRequest>;
// ─────────────────────────────────────────────────────────────────────────────────────────

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
  addDate: z.coerce.date(), // Mantido conforme o teu original
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

export const RespondTimeOffRequest = z.object({
  status: z.enum([TimeOffStatus.APPROVED, TimeOffStatus.DENIED]),
  responseNote: z.string().optional().nullable(),
});

export type RespondTimeOffRequest = z.infer<typeof RespondTimeOffRequest>;

export const UpsertVacationPolicyRequest = z.object({
  maxVacationDaysPerYear: z.number().int().min(1).max(365),
});

export type UpsertVacationPolicyRequest = z.infer<typeof UpsertVacationPolicyRequest>;