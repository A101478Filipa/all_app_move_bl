import i18n from '@src/localization';
import type { LanguageCode } from '@src/localization/types';

export const localizationService = {
  /**
   * Get the current language
   */
  getCurrentLanguage: (): string => {
    return i18n.language;
  },

  /**
   * Change the app language
   */
  changeLanguage: async (languageCode: LanguageCode): Promise<void> => {
    try {
      await i18n.changeLanguage(languageCode);
      console.log('Language changed to:', languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    }
  },

  /**
   * Get available languages
   */
  getAvailableLanguages: (): LanguageCode[] => {
    return ['en', 'pt'];
  },

  /**
   * Check if a language is supported
   */
  isLanguageSupported: (languageCode: string): languageCode is LanguageCode => {
    return ['en', 'pt'].includes(languageCode as LanguageCode);
  },
};