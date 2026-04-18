import { api } from '@src/services/ApiService';
import { CalendarEvent, CreateCalendarEventRequest, UpdateCalendarEventRequest } from 'moveplus-shared';
import { ApiResponse } from '@src/types/api';

export const calendarEventApi = {
  getEvents: (elderlyId: number): Promise<ApiResponse<CalendarEvent[]>> =>
    api.get(`calendar-events/elderly/${elderlyId}`).then(r => r.data),

  getProfessionalEvents: (userId: number): Promise<ApiResponse<(CalendarEvent & { elderly?: { id: number; name: string; medicalId: number } })[]>> =>
    api.get(`calendar-events/professional/${userId}`).then(r => r.data),

  getInstitutionEvents: (): Promise<ApiResponse<(CalendarEvent & { elderly?: { id: number; name: string; medicalId: number } })[]>> =>
    api.get('calendar-events/institution').then(r => r.data),

  createEvent: (elderlyId: number, data: CreateCalendarEventRequest): Promise<ApiResponse<CalendarEvent>> =>
    api.post(`calendar-events/elderly/${elderlyId}`, data).then(r => r.data),

  updateEvent: (eventId: number, data: UpdateCalendarEventRequest): Promise<ApiResponse<CalendarEvent>> =>
    api.put(`calendar-events/${eventId}`, data).then(r => r.data),

  deleteEvent: (eventId: number): Promise<ApiResponse<void>> =>
    api.delete(`calendar-events/${eventId}`).then(r => r.data),
};
