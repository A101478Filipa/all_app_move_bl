export interface Address {
  id: number;
  street: string;
  municipality: string;
  district: string;
  country: string;
  postalCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
}