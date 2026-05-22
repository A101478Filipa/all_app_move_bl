import { CalendarEventType } from '../enums/calendarEventType';
import { ExternalProfessional } from './externalProfessional';

export interface CalendarEvent {
  id: number;
  elderlyId: number;
  createdById: number;
  assignedToId?: number | null;
  externalProfessionalName?: string | null; // legacy free-text field
  externalProfessionalId?: number | null;
  type: CalendarEventType;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: number;
    name: string;
    role: string;
  };
  assignedTo?: {
    id: number;
    name: string;
    role: string;
  } | null;
  externalProfessional?: Pick<ExternalProfessional, 'id' | 'name' | 'specialty' | 'phone'> | null;
}
