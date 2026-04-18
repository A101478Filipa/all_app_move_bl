import { Gender } from "src/enums/gender";
import { User } from "./user";
import { Institution } from "../institution";

export interface Clinician {
  id: number;
  userId: number;
  name: string;
  phone?: string | null;
  institutionId?: number | null;
  birthDate: Date;
  gender: Gender;
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  user: User;
  institution?: Institution | null;
}