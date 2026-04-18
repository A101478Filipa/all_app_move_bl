import { Gender } from "../../enums/gender";

export interface RegisterElderlyRequest {
  username: string;
  password: string;
  name: string;
  medicalId: string;
  birthDate: string;
  gender: Gender;
  address?: string;
  phone?: string;
  email?: string;
  emergencyContact?: string;
  institutionId?: number;
}