import { Gender } from "src/enums/gender";
import { Institution } from "../institution";
import { User } from "./user";
import { BaseUser } from "src/models/baseUser";

export interface InstitutionAdmin extends BaseUser {
  id: number;
  userId: number;
  institutionId: number;
  name: string;
  gender: Gender;
  phoneNumber?: string | null;
  birthDate: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  user: User;
  institution: Institution;
}