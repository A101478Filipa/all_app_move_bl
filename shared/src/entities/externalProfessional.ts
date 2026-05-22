export interface ExternalProfessional {
  id: number;
  institutionId: number;
  name: string;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
