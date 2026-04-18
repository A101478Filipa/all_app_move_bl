import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { VStack, HStack } from '@components/CoreComponents';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '@src/localization/hooks/useTranslation';

type AvatarSuggestionWidgetProps = {
  onPress: () => void;
};

export const AvatarSuggestionWidget: React.FC<AvatarSuggestionWidgetProps> = ({ onPress }) => {
  const { t } = useTranslation();

  return (
    <VStack spacing={Spacing.sm_8} style={styles.section}>
      <Text style={styles.sectionTitle}>{t('dashboard.setupAccount')}</Text>
      <TouchableOpacity
        style={styles.avatarSuggestedWidget}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <HStack spacing={Spacing.md_16} align="center">
          <View style={[styles.iconContainer, { backgroundColor: `${Color.secondary}15` }]}>
            <MaterialIcons name="add-a-photo" size={24} color={Color.secondary} />
          </View>
          <VStack align="flex-start" style={{ flex: 1 }}>
            <Text style={styles.widgetTitle}>
              {t('dashboard.addProfilePhoto')}
            </Text>
            <Text style={styles.widgetSubtitle}>
              {t('dashboard.personalizeAccount')}
            </Text>
          </VStack>
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={Color.Gray.v400}
          />
        </HStack>
      </TouchableOpacity>
    </VStack>
  );
};

const styles = StyleSheet.create({
  section: {
    alignSelf: 'stretch',
    marginBottom: Spacing.xl_32,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.Gray.v500,
    alignSelf: 'flex-start',
  },
  avatarSuggestedWidget: {
    backgroundColor: Color.white,
    padding: Spacing.md_16,
    borderRadius: Border.lg_16,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: Color.secondary,
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Border.sm_8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  widgetSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
});
