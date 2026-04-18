import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { VStack } from '@components/CoreComponents';
import InfoRowComponent from '@components/InfoRowComponent';
import { formatDateLong } from '@src/utils/Date';
import { useTranslation } from 'react-i18next';
import { MeasurementType, MeasurementUnit } from 'moveplus-shared';
import { getMeasurementTypeLabel, getMeasurementUnitLabel } from '@src/utils/measurementHelper';

// Icons
import HeartIcon from '@icons/generic-ecg-heart.svg';
import CalendarIcon from '@icons/generic-calendar.svg';
import MoreIcon from '@icons/generic-more.svg';

export interface MeasurementDetailsProps {
  measurementType: MeasurementType;
  value: number;
  unit: MeasurementUnit;
  notes?: string;
  createdAt: Date;
  elderlyName?: string;
}

export const MeasurementDetailsComponent: React.FC<MeasurementDetailsProps> = ({
  measurementType,
  value,
  unit,
  notes,
  createdAt,
  elderlyName
}) => {
  const { t } = useTranslation();

  const formatMeasurementValue = () => {
    const unitLabel = getMeasurementUnitLabel(unit, t);
    return `${value} ${unitLabel}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <VStack align="flex-start" spacing={Spacing.lg_24}>
          {/* Header */}
          <VStack align="flex-start" spacing={Spacing.md_16} style={styles.header}>
            <Text style={styles.measurementType}>{getMeasurementTypeLabel(measurementType, t)}</Text>
            <Text style={styles.measurementValue}>{formatMeasurementValue()}</Text>
            {elderlyName && (
              <Text style={styles.elderlyName}>{t('common.patient')}: {elderlyName}</Text>
            )}
          </VStack>

          {/* Measurement Details */}
          <VStack align="flex-start" spacing={Spacing.md_16} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('measurements.measurementDetails')}</Text>

            <VStack align="flex-start" style={styles.infoContainer}>
              <InfoRowComponent
                iconName="monitor-heart"
                title={t('measurements.measurementType')}
                value={getMeasurementTypeLabel(measurementType, t)}
                isLast={false}
              />
              <InfoRowComponent
                iconName="analytics"
                title={t('measurements.value')}
                value={formatMeasurementValue()}
                isLast={true}
              />
            </VStack>
          </VStack>

          {/* Notes */}
          {notes && (
            <VStack align="flex-start" spacing={Spacing.md_16} style={styles.section}>
              <Text style={styles.sectionTitle}>{t('measurements.notes')}</Text>

              <VStack align="flex-start" style={styles.infoContainer}>
                <InfoRowComponent
                  iconName="note-alt"
                  title={t('measurements.notes')}
                  value={notes}
                  isLast={true}
                />
              </VStack>
            </VStack>
          )}

          {/* Created Date */}
          <VStack align="flex-start" spacing={Spacing.md_16} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('measurements.recordedAt')}</Text>

            <VStack align="flex-start" style={styles.infoContainer}>
              <InfoRowComponent
                iconName="schedule"
                title={t('measurements.recordedAt')}
                value={formatDateLong(createdAt)}
                isLast={true}
              />
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  scrollContainer: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
  header: {
    ...shadowStyles.cardShadow,
    backgroundColor: Color.Background.white,
    borderRadius: Border.sm_8,
    padding: Spacing.md_16,
    alignSelf: 'stretch',
  },
  measurementType: {
    fontSize: FontSize.heading2_28,
    fontFamily: FontFamily.bold,
    color: Color.dark,
  },
  measurementValue: {
    fontSize: FontSize.heading3_24,
    fontFamily: FontFamily.semi_bold,
    color: Color.primary,
  },
  elderlyName: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    fontStyle: 'italic',
  },
  section: {
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: FontSize.heading3_24,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  infoContainer: {
    ...shadowStyles.cardShadow,
    backgroundColor: Color.Background.white,
    borderRadius: Border.sm_8,
    padding: Spacing.md_16,
    alignSelf: 'stretch',
  },
});