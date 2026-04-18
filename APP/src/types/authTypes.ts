import { UserRole } from "moveplus-shared";
import { AppUser } from "moveplus-shared";

export interface AuthState {
  user: AppUser | null,
  loading: boolean,
  error: string | null
};

export interface Credentials {
  username: string;
  password: string;
}

export interface RefreshUserArgs {
  id: number;
  role: UserRole;
  baseUrl: string;
}
