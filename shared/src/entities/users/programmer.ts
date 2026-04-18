import { User } from "./user";

export interface Programmer {
  id: number;
  userId: number;
  name: string;
  gender: string;
  phoneNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  user: User;
}