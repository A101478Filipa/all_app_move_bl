import { Gender } from "src/enums/gender";
import { Institution } from "../institution";
import { User } from "./user";
import { BaseUser } from "src/models/baseUser";

export interface Caregiver extends BaseUser {
  id: number;
  userId: number;
  name: string;
  phone?: string | null;
  institutionId: number;
  birthDate: Date;
  gender: Gender;
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  user: User;
  institution: Institution;
}