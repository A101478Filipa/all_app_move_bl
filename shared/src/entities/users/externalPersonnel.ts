export interface ExternalPersonnel {
  id: number;
  userId: number;
  institutionId?: number | null;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}