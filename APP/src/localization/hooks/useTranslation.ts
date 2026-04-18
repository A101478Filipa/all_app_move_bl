import { useTranslation as useI18nextTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nextTranslation();

  return {
    t,
    changeLanguage: i18n.changeLanguage,
    currentLanguage: i18n.language,
  };
};