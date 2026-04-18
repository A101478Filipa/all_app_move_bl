import { TimeOffType } from '../enums/timeOffType';

export interface StaffWorkSchedule {
  id: number;
  userId: number;
  /** 1=Mon … 7=Sun (ISO weekday) */
  workDays: number[];
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  createdAt: string;
  updatedAt: string;
}

export interface StaffTimeOff {
  id: number;
  userId: number;
  createdById: number;
  type: TimeOffType;
  startDate: string;
  endDate: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; role: string };
  createdBy?: { id: number; name: string };
}

export interface ElderlyAbsence {
  id: number;
  elderlyId: number;
  createdById: number;
  startDate: string;
  endDate: string;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: number; name: string };
}
