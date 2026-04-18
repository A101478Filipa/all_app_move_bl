import { AppUser } from "src/entities/users/appUser";
import { UserRole } from "../../enums/userRole";

export interface UserConfig {
  baseUrl: string;
}

export interface ProfileIncompleteData {
  userId: number;
  role: UserRole;
  institutionId?: number;
  email: string;
  username: string;
}

export interface LoginResponse {
  user?: AppUser;
  accessToken?: string;
  config?: UserConfig;
  profileIncomplete?: boolean;
  profileData?: ProfileIncompleteData;
}