import { Gender } from "src/enums/gender";
import { Assessment } from "../assessment";
import { FallDetection } from "../fallDetection";
import { FallOccurrence } from "../fallOccurrence";
import { FallRisk } from "../fallRisk";
import { Institution } from "../institution";
import { Measurement } from "../measurement";
import { Medication } from "../medication";
import { Pathology } from "../pathology";
import { Session } from "../session";
import { SosOccurrence } from "../sosOccurrence";
import { User } from "./user";
import { BaseUser } from "src/models/baseUser";

export interface Elderly extends BaseUser {
  id: number;
  userId: number;
  medicalId: number;
  name: string;
  institutionId: number;
  birthDate: Date;
  gender: Gender;
  floor?: number | null;
  address?: string | null;
  phone?: string | null;
  emergencyContact?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  user: User;
  institution: Institution;
  assessments: Assessment[];
  sessions: Session[];
  fallDetections: FallDetection[];
  fallRisks: FallRisk[];
  fallOccurrences: FallOccurrence[];
  sosOccurrences: SosOccurrence[];
  pathologies: Pathology[];
  medications: Medication[];
  measurements: Measurement[];
  woundTrackingCount?: number;
}