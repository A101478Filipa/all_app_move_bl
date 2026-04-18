import { Gender } from "../../enums/gender";

export interface RegisterCaregiverRequest {
  username: string;
  password: string;
  name: string;
  birthDate: string;
  gender: Gender;
  phone?: string;
  email: string;
  institutionId?: number;
}