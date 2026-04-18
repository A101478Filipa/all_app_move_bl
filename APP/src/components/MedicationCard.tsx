import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Medication, MedicationStatus } from 'moveplus-shared';
import { HStack, Spacer, VStack } from '@components/CoreComponents';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { MaterialIcons } from '@expo/vector-icons';
import { shadowStyles } from '@styles/shadow';
import { Border } from '@styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';

export interface MedicationCardProps {
  medication: Medication;
  onPress: (medication: Medication) => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onPress
}) => {
  const { t } = useTranslation();

  const getMedicationStatusLabel = (status?: MedicationStatus | string | null) => {
    if (!status) return '';

    switch (status.toString().toUpperCase()) {
      case MedicationStatus.ACTIVE:
        return t('medication.statusOptions.active');
      case MedicationStatus.INACTIVE:
        return t('medication.statusOptions.inactive');
      case MedicationStatus.PAUSED:
        return t('medication.statusOptions.paused');
      case MedicationStatus.DISCONTINUED:
        return t('medication.statusOptions.discontinued');
      case MedicationStatus.COMPLETED:
        return t('medication.statusOptions.completed');
      default:
        return status.toString();
    }
  };

  const getStatusColor = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return Color.Cyan.v500;
      case 'inactive':
        return Color.Gray.v400;
      case 'paused':
        return Color.Warning.orange;
      case 'discontinued':
        return Color.Error.default;
      default:
        return Color.Gray.v400;
    }
  };

  const getStatusBadgeStyle = (status?: string | null) => ({
    ...styles.statusBadge,
    backgroundColor: getStatusColor(status),
  });

  return (
    <TouchableOpacity
      onPress={() => onPress(medication)}
      style={styles.container}
    >
      <HStack align="center" style={styles.content}>
        <HStack align="center" spacing={Spacing.sm_8}>
          <MaterialIcons name="medication" size={20} color={Color.primary} />

          <VStack align="flex-start" spacing={Spacing.xxs_2} style={styles.textContainer}>
            <HStack align="center" spacing={Spacing.xs_4}>
              <Text style={styles.medicationName} numberOfLines={1} ellipsizeMode="tail">{medication.name}</Text>
              {medication.status && (
                <VStack style={getStatusBadgeStyle(medication.status)}>
                  <Text style={styles.statusText}>{getMedicationStatusLabel(medication.status)}</Text>
                </VStack>
              )}
            </HStack>

            {medication.activeIngredient && (
              <Text style={styles.activeIngredient} numberOfLines={1} ellipsizeMode="tail">
                {medication.activeIngredient}
              </Text>
            )}

            <HStack align="center" spacing={Spacing.xs_4}>
              {medication.dosage && (
                <Text style={styles.dosageText} numberOfLines={1} ellipsizeMode="tail">{medication.dosage}</Text>
              )}
              {medication.frequency && (
                <Text style={styles.frequencyText} numberOfLines={1} ellipsizeMode="tail">• {medication.frequency}</Text>
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
  medicationName: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
    alignSelf: 'stretch',
  },
  activeIngredient: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
    fontStyle: 'italic',
    alignSelf: 'stretch',
  },
  dosageText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
  },
  frequencyText: {
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