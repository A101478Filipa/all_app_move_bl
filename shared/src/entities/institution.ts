export interface Institution {
  id: number;
  name: string;
  nickname: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  createdAt: Date;
  updatedAt: Date;
}