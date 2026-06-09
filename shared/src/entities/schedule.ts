import { TimeOffType } from '../enums/timeOffType';
import { TimeOffStatus } from '../enums/timeOffStatus';

// Interface para o slot de cada dia individual
export interface WorkScheduleSlot {
  id: number;
  scheduleId: number;
  dayIso: number;    // 1=Seg … 7=Dom (ISO)
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  isActive: boolean;
}

export interface StaffWorkSchedule {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  slots: WorkScheduleSlot[]; 
}

export interface StaffTimeOff {
  id: number;
  userId: number;
  createdById: number;
  type: TimeOffType;
  status: TimeOffStatus;
  startDate: string;
  endDate: string;
  note?: string | null;
  respondedById?: number | null;
  respondedAt?: string | null;
  responseNote?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; role: string };
  createdBy?: { id: number; name: string };
  respondedBy?: { id: number; name: string } | null;
}

export interface VacationPolicy {
  id: number;
  institutionId: number;
  maxVacationDaysPerYear: number;
  createdAt: string;
  updatedAt: string;
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