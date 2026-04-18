import { z } from 'zod';
import { CalendarEventType } from '../../enums/calendarEventType';

export const UpdateCalendarEventRequest = z.object({
  type: z.nativeEnum(CalendarEventType).optional(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  assignedToId: z.number().int().positive().optional().nullable(),
  externalProfessionalName: z.string().optional().nullable(),
});

export type UpdateCalendarEventRequest = z.infer<typeof UpdateCalendarEventRequest>;
