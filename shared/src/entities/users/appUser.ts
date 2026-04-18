import { Clinician } from "./clinician";
import { InstitutionMember } from "./institutionMember";
import { Programmer } from "./programmer";

export type AppUser = InstitutionMember
  | Clinician
  | (Programmer & { institutionId?: undefined });