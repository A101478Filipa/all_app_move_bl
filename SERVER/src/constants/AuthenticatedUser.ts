import { UserRole } from "moveplus-shared";

export interface AuthenticatedUser {
  userId: number;
  role: UserRole;
  institutionId?: number;
}