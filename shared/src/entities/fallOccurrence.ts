import { FallDetection } from "./fallDetection";
import { Caregiver } from "./users/caregiver";
import { Elderly } from "./users/elderly";
import { InstitutionAdmin } from "./users/institutionAdmin";
import { User } from "./users/user";

export interface FallOccurrence {
  id: number;
  elderlyId: number;
  handlerUserId?: number | null;
  detectionId?: number | null;
  date: Date;
  description?: string | null;
  recovery?: string | null;
  preActivity?: string | null;
  postActivity?: string | null;
  direction?: string | null;
  environment?: string | null;
  injured: boolean;
  injuryDescription?: string | null;
  measuresTaken?: string | null;
  isFalseAlarm: boolean;
  createdAt: Date;

  // Relationships
  elderly: Elderly;
  detection?: FallDetection | null;
  handler?: Caregiver | InstitutionAdmin | null;
}