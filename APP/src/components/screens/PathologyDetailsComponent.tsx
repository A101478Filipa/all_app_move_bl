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

export interface PathologyDetailsProps {
  pathologyName: string;
  description?: string;
  diagnosisSite?: string;
  status?: string;
  notes?: string;
  createdAt: Date;
  elderlyName?: string;
}

export const PathologyDetailsComponent: React.FC<PathologyDetailsProps> = ({
  pathologyName,
  description,
  diagnosisSite,
  status,
  notes,
  createdAt,
  elderlyName
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

  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'active':
        return Color.Error.default;
      case 'inactive':
        return Color.Gray.v400;
      case 'resolved':
        return Color.Cyan.v500;
      case 'chronic':
        return Color.Warning.orange;
      default:
        return Color.Gray.v500;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <VStack align="flex-start" spacing={Spacing.lg_24}>
          {/* Header */}
          <VStack align="flex-start" spacing={Spacing.sm_8} style={styles.header}>
            <Text style={styles.pathologyName}>{pathologyName}</Text>
            {status && (
              <Text style={[styles.status, { color: getStatusColor() }]}>
                {t('pathology.status')}: {getStatusLabel(status)}
              </Text>
            )}
            {elderlyName && (
              <Text style={styles.elderlyName}>{t('common.patient')}: {elderlyName}</Text>
            )}
          </VStack>

          {/* Pathology Details */}
          <VStack align="flex-start" spacing={Spacing.md_16} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('pathology.conditionDetails')}</Text>

            <VStack align="flex-start" style={styles.infoContainer}>
                <InfoRowComponent
                  iconName="medical-services"
                  title={t('pathology.conditionName')}
                  value={pathologyName}
                  isLast={!description}
                />
                {description && (
                  <InfoRowComponent
                    iconName="assignment"
                    title={t('pathology.description')}
                    value={description}
                    isLast={true}
                  />
                )}
            </VStack>
          </VStack>

          {/* Diagnosis Information */}
          {diagnosisSite && (
            <VStack align="flex-start" spacing={Spacing.md_16} style={styles.section}>
              <Text style={styles.sectionTitle}>{t('pathology.diagnosisInformation')}</Text>

              <VStack align="flex-start" style={styles.infoContainer}>
                  <InfoRowComponent
                    iconName="local-hospital"
                    title={t('pathology.diagnosisSite')}
                    value={diagnosisSite}
                    isLast={true}
                  />
              </VStack>
            </VStack>
          )}

          {/* Notes */}
          {notes && (
            <VStack align="flex-start" spacing={Spacing.md_16} style={styles.section}>
              <Text style={styles.sectionTitle}>{t('pathology.notes')}</Text>

              <VStack align="flex-start" style={styles.infoContainer}>
                  <InfoRowComponent
                    iconName="sticky-note-2"
                    title={t('pathology.notes')}
                    value={notes}
                    isLast={true}
                  />
              </VStack>
            </VStack>
          )}

          {/* Created Date */}
          <VStack align="flex-start" spacing={Spacing.md_16} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('pathology.added')}</Text>

            <VStack align="flex-start" style={styles.infoContainer}>
                <InfoRowComponent
                  iconName="post-add"
                  title={t('pathology.added')}
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
    ...spacingStyles.screenScrollContainer
  },
  header: {
    ...shadowStyles.cardShadow,
    backgroundColor: Color.Background.white,
    borderRadius: Border.sm_8,
    padding: Spacing.md_16,
    alignSelf: 'stretch',
  },
  pathologyName: {
    fontSize: FontSize.heading2_28,
    fontFamily: FontFamily.bold,
    color: Color.dark,
  },
  status: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
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