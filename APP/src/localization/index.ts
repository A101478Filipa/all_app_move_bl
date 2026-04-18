import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './resources/en.json';
import pt from './resources/pt.json';

const resources = {
  en: { translation: en },
  pt: { translation: pt },
};

const getDeviceLanguage = (): string => {
  try {
    const locales = getLocales();
    const primaryLocale = locales[0];
    const languageCode = primaryLocale.languageCode;

    console.log('Device language detected:', languageCode, 'Full locale:', primaryLocale);

    if (resources[languageCode as keyof typeof resources]) {
      console.log('Using supported language:', languageCode);
      return languageCode;
    }

    console.log('Language not supported, falling back to English');
    return 'en';
  } catch (error) {
    console.warn('Error detecting device language, using English as fallback:', error);
    return 'en';
  }
};

const defaultLanguage = 'pt' // getDeviceLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    returnEmptyString: false,
    returnNull: false,
    returnObjects: false,
    keySeparator: '.',
    debug: __DEV__,
  })
  .then(() => {
    console.log('i18n initialized successfully with language:', defaultLanguage);
    console.log('Available languages:', Object.keys(resources));
  })
  .catch((error) => {
    console.error('i18n initialization failed:', error);
  });

export default i18n;