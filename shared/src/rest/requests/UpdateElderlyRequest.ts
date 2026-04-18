import { Gender } from "../../enums/gender";

export interface UpdateElderlyRequest {
  name: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  gender?: Gender;
  nif?: string;
  address?: string;
  floor?: number | null;
}
