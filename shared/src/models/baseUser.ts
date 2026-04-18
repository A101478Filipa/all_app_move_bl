import { Institution } from "src/entities/institution";
import { User } from "src/entities/users/user";
import { Gender } from "src/enums/gender";

export interface BaseUser {
  id: number;
  name: string;
  birthDate: Date;
  gender: Gender;

  userId: number;
  user: User;

  institutionId: number;
  institution: Institution;
};