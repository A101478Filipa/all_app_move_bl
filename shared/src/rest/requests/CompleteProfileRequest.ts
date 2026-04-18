import { UserRole } from '../../enums/userRole';

export interface CompleteProfileRequest {
  role: UserRole;
  profileData: ElderlyProfileData | CaregiverProfileData | InstitutionAdminProfileData;
}

export interface BaseProfileData {
  userId: number;
  institutionId: number;
  name: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  email: string;
}

export interface ElderlyProfileData extends BaseProfileData {
  medicalId: number;
  phone?: string;
  address?: string;
  nif?: string;             
}

export interface CaregiverProfileData extends BaseProfileData {
  phone?: string;
  address?: string;         
  nif?: string;             
}

export interface InstitutionAdminProfileData extends BaseProfileData {
  phoneNumber?: string;
  address?: string;         
  nif?: string;             
}