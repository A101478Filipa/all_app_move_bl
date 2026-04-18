import { Gender } from "moveplus-shared";

export const getGenderTitle = (gender: Gender, t: (key: string) => string) => {
  switch (gender) {
    case Gender.MALE: return t('gender.male');
    case Gender.FEMALE: return t('gender.female');
    default: return t('gender.other');
  }
};