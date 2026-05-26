export interface SearchElderlyResponse {
  id: number;
  medicalId: number;
  name: string;
  birthDate: Date;
  gender: string;
  user: {
    avatarUrl?: string;
  };
}
