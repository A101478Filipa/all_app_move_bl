import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pathology, PathologyStatus } from 'moveplus-shared';
import { HStack, Spacer, VStack } from '@components/CoreComponents';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { MaterialIcons } from '@expo/vector-icons';
import { shadowStyles } from '@styles/shadow';
import { Border } from '@styles/borders';
import { formatDateLong } from '@src/utils/Date';
import { useTranslation } from '@src/localization/hooks/useTranslation';

export interface PathologyCardProps {
  pathology: Pathology;
  onPress: (pathology: Pathology) => void;
}

export const PathologyCard: React.FC<PathologyCardProps> = ({
  pathology,
  onPress
}) => {
  const { t } = useTranslation();

  const getStatusLabel = (status?: string) => {
    if (!status) return '';

    switch (status.toLowerCase()) {
      case 'active':
        return t('pathology.statusOptions.active');
      case 'inactive':
        return t('pathology.statusOptions.inactive');
      case 'chronic':
        return t('pathology.statusOptions.chronic');
      case 'resolved':
        return t('pathology.statusOptions.resolved');
      case 'under_treatment':
        return t('pathology.statusOptions.under_treatment');
      case 'monitoring':
        return t('pathology.statusOptions.monitoring');
      default:
        return status;
    }
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'ACTIVE':
        return Color.Error.default;
      case 'INACTIVE':
        return Color.Gray.v400;
      case 'RESOLVED':
        return Color.Cyan.v500;
      case 'CHRONIC':
        return Color.Warning.orange;
      case 'UNDER_TREATMENT':
        return Color.primary;
      case 'MONITORING':
        return Color.Warning.orange;
      default:
        return Color.Gray.v500;
    }
  };

  const getStatusBadgeStyle = (status?: string | null) => ({
    ...styles.statusBadge,
    backgroundColor: getStatusColor(status),
  });

  return (
    <TouchableOpacity
      onPress={() => onPress(pathology)}
      style={styles.container}
    >
      <HStack align="center" style={styles.content}>
        <HStack align="center" spacing={Spacing.sm_8}>
          <MaterialIcons name="warning" size={20} color={Color.Warning.orange} />

          <VStack align="flex-start" spacing={Spacing.xxs_2} style={styles.textContainer}>
            <HStack align="center" spacing={Spacing.xs_4}>
              <Text style={styles.pathologyName} numberOfLines={1} ellipsizeMode="tail">{pathology.name}</Text>
              {pathology.status && (
                <VStack style={getStatusBadgeStyle(pathology.status)}>
                  <Text style={styles.statusText}>{getStatusLabel(pathology.status)}</Text>
                </VStack>
              )}
            </HStack>

            {pathology.description && (
              <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
                {pathology.description}
              </Text>
            )}

            <HStack align="center" spacing={Spacing.xs_4}>
              {pathology.diagnosisDate && (
                <Text style={styles.diagnosisDateText} numberOfLines={1} ellipsizeMode="tail">
                  {formatDateLong(new Date(pathology.diagnosisDate))}
                </Text>
              )}
            </HStack>
          </VStack>
        </HStack>

        <Spacer />

        <MaterialIcons name="chevron-right" size={20} color={Color.Gray.v400} />
      </HStack>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
    backgroundColor: Color.Background.white,
    borderRadius: Border.sm_8,
  },
  content: {
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.md_16,
    marginVertical: Spacing.xxs_2,
  },
  textContainer: {
    alignSelf: 'stretch',
  },
  pathologyName: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
    fontStyle: 'italic',
  },
  diagnosisSiteText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
  },
  diagnosisDateText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  statusBadge: {
    borderRadius: Border.xs_4,
    paddingHorizontal: Spacing.xs_4,
    paddingVertical: 2,
  },
  statusText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Color.white,
    textTransform: 'uppercase',
  },
});