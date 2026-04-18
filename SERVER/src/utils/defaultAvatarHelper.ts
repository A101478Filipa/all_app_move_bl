import { UserRole } from "moveplus-shared";

export const initUserRole = (roleString?: string): UserRole | null => {
  const value = roleString?.toUpperCase() as UserRole;
  return Object.values(UserRole).includes(value) ? value : null;
};

export const roleDefaultAvatarUrl = (userRole?: string): string => {
  const role: UserRole = initUserRole(userRole) || UserRole.ELDERLY;
  return `default/default_avatar_${role.toLocaleLowerCase()}.jpg`;
};
