export enum TimelineActivityType {
  FALL_OCCURRENCE = 'FALL_OCCURRENCE',
  MEASUREMENT_ADDED = 'MEASUREMENT_ADDED',
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  MEDICATION_UPDATED = 'MEDICATION_UPDATED',
  PATHOLOGY_ADDED = 'PATHOLOGY_ADDED',
  USER_ADDED = 'USER_ADDED',
  USER_UPDATED = 'USER_UPDATED',
  SOS_OCCURRENCE = 'SOS_OCCURRENCE',
  CALENDAR_EVENT_ADDED = 'CALENDAR_EVENT_ADDED',
}

export interface TimelineActivity {
  id: number;
  institutionId: number;
  type: TimelineActivityType;
  elderlyId?: number;
  userId?: number;
  relatedId?: number;
  metadata?: Record<string, any>;
  createdAt: Date;

  elderly?: {
    id: number;
    name: string;
    medicalId: number;
  };
  user?: {
    id: number;
    name: string;
    role: string;
  };
}

export interface TimelineSection {
  title: string;
  data: TimelineActivity[];
}