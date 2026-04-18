import { z } from 'zod';
import { CalendarEventType } from '../../enums/calendarEventType';

export const CreateCalendarEventRequest = z.object({
  type: z.nativeEnum(CalendarEventType),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  allDay: z.boolean().optional().default(false),
  location: z.string().optional(),
  assignedToId: z.number().int().positive().optional().nullable(),
  externalProfessionalName: z.string().optional().nullable(),
});

export type CreateCalendarEventRequest = z.infer<typeof CreateCalendarEventRequest>;
