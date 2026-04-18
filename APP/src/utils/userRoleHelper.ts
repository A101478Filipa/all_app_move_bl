import { UserRole } from "moveplus-shared";

const userRoleSet = new Set(Object.values(UserRole));

const isValidUserRole = (role: string): role is UserRole => {
  return userRoleSet.has(role as UserRole);
};

export const initUserRole = (roleString?: string): UserRole => {
  if (!roleString) return UserRole.UNKNOWN;

  const match = Object.values(UserRole).find(
    r => r.toLowerCase() === roleString.toLowerCase()
  );

  return match as UserRole || UserRole.UNKNOWN;
};

export const getTitle = (userRole: UserRole, t: (key: string) => string): string => {
  switch (userRole) {
    case UserRole.ELDERLY:
      return t('userRole.elderly');
    case UserRole.CAREGIVER:
      return t('userRole.caregiver');
    case UserRole.INSTITUTION_ADMIN:
      return t('userRole.admin');
    case UserRole.CLINICIAN:
      return t('userRole.clinician');
    case UserRole.PROGRAMMER:
      return t('userRole.programmer');
    case UserRole.UNKNOWN:
    default:
      return t('userRole.unknown');
  }
};
