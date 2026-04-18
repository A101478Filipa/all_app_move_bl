import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { HStack, VStack } from '@components/CoreComponents';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { MaterialIcons } from '@expo/vector-icons';
import type { LanguageCode } from '@src/localization/types';

const languages = [
  { code: 'en' as LanguageCode, name: 'English', flag: '🇺🇸' },
  { code: 'pt' as LanguageCode, name: 'Português', flag: '🇵🇹' },
];

interface LanguageSwitcherProps {
  style?: ViewStyle;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ style }) => {
  const { changeLanguage, currentLanguage } = useTranslation();

  const handleLanguageChange = (languageCode: LanguageCode) => {
    changeLanguage(languageCode);
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <VStack spacing={Spacing.sm_8} style={{ ...styles.container, ...style }}>
      <Text style={styles.title}>Language / Idioma</Text>

      <VStack spacing={0} style={styles.optionsContainer}>
        {languages.map((language, index) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.option,
              currentLanguage === language.code && styles.selectedOption,
              index < languages.length - 1 && styles.optionBorder,
            ]}
            onPress={() => handleLanguageChange(language.code)}
          >
            <HStack spacing={Spacing.md_16} align="center">
              <Text style={styles.flag}>{language.flag}</Text>
              <Text
                style={[
                  styles.languageName,
                  currentLanguage === language.code && styles.selectedText,
                ]}
              >
                {language.name}
              </Text>
              {currentLanguage === language.code && (
                <MaterialIcons name="check" size={20} color={Color.primary} />
              )}
            </HStack>
          </TouchableOpacity>
        ))}
      </VStack>
    </VStack>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
    marginBottom: Spacing.xs_4,
  },
  optionsContainer: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    borderColor: Color.Gray.v100,
    borderWidth: 1,
    ...shadowStyles.cardShadow,
    overflow: 'hidden',
  },
  option: {
    padding: Spacing.md_16,
    alignSelf: 'stretch',
  },
  selectedOption: {
    backgroundColor: Color.primary + '08',
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v100,
  },
  flag: {
    fontSize: 24,
  },
  languageName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
    flex: 1,
  },
  selectedText: {
    color: Color.primary,
    fontFamily: FontFamily.bold,
  },
});