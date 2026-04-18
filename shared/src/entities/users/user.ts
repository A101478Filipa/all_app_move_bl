import { UserRole } from "../../enums/userRole";

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}