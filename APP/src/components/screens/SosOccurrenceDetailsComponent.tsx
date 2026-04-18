import React from 'react';
import { VStack } from '@components/CoreComponents';
import { StyleSheet, Text, ScrollView, View } from 'react-native';
import { Color } from '@src/styles/colors';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { shadowStyles } from '@src/styles/shadow';
import { formatDateLong } from '@src/utils/Date';
import { useTranslation } from 'react-i18next';

type Props = {
  data: any;
};

const DetailRow = ({ label, value, important = false }: {
  label: string,
  value?: string | number | boolean | null,
  important?: boolean
}) => (
  <View style={[styles.detailRow, important && styles.importantRow]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, important && styles.importantValue]}>
      {value === null || value === undefined || value === '' ? '-' : String(value)}
    </Text>
  </View>
);

const Card = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

const SosOccurrenceDetailsComponent: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const handled = Boolean(data?.handlerUserId);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <VStack align="flex-start" spacing={Spacing.lg_24}>
        
        <Card title={t('sosOccurrence.basicInformation')}>
          <VStack align="flex-start" spacing={Spacing.sm_8}>
            <DetailRow label={t('sosOccurrence.elderly')} value={data?.elderly?.name} important />
            <DetailRow label={t('sosOccurrence.date')} value={data?.date ? formatDateLong(data.date) : null} important />
            <DetailRow label={t('sosOccurrence.status')} value={handled ? t('sosOccurrence.handled') : t('sosOccurrence.unhandled')} important />
            {data?.isFalseAlarm && (
              <View style={styles.falseAlarmBadge}><Text style={styles.falseAlarmText}>{t('sosOccurrence.falseAlarm')}</Text></View>
            )}
            <DetailRow label={t('sosOccurrence.wasActualFall')} value={data?.wasActualFall ? t('common.yes') : t('common.no')} />
            <DetailRow label={t('sosOccurrence.notes')} value={data?.notes} />
          </VStack>
        </Card>

        {handled && !data?.isFalseAlarm && (
          <>
            <Card title={data?.wasActualFall ? t('fallOccurrence.fallDetails') : t('sosOccurrence.occurrenceDetails')}>
              <VStack align="flex-start" spacing={Spacing.sm_8}>
                <DetailRow label={t('fallOccurrence.recoveryProcess')} value={data?.recovery} />
                <DetailRow label={t('fallOccurrence.preActivity')} value={data?.preActivity} />
                <DetailRow label={t('fallOccurrence.postActivity')} value={data?.postActivity} />
                {/* MOSTRA DIREÇÃO APENAS SE FOR QUEDA */}
                {data?.wasActualFall && (
                   <DetailRow label={t('fallOccurrence.fallDirection')} value={data?.direction} />
                )}
                <DetailRow label={t('fallOccurrence.environment')} value={data?.environment} />
              </VStack>
            </Card>

            <Card title={t('fallOccurrence.injuryInformation')}>
              <VStack align="flex-start" spacing={Spacing.sm_8}>
                <DetailRow label={t('fallOccurrence.injured')} value={data?.injured ? t('common.yes') : t('common.no')} important={data?.injured} />
                {data?.injured && (
                  <View style={styles.injuryDetails}>
                    <DetailRow label={t('fallOccurrence.injuryDescription')} value={data?.injuryDescription} />
                  </View>
                )}
                <DetailRow label={t('fallOccurrence.measuresTaken')} value={data?.measuresTaken} />
              </VStack>
            </Card>
          </>
        )}
      </VStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
  card: {
    backgroundColor: Color.white,
    padding: Spacing.lg_24,
    borderRadius: Border.lg_16,
    ...shadowStyles.cardShadow,
    alignSelf: 'stretch',
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.primary,
    marginBottom: Spacing.md_16,
  },
  detailRow: {
    paddingVertical: Spacing.xs_4,
    width: '100%',
  },
  importantRow: {
    backgroundColor: Color.primary + '08',
    paddingHorizontal: Spacing.sm_8,
    borderRadius: Border.sm_8,
  },
  detailLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
    lineHeight: 22,
  },
  importantValue: {
    fontFamily: FontFamily.bold,
    color: Color.primary,
  },
  descriptionBox: {
    marginTop: Spacing.sm_8,
    padding: Spacing.sm_8,
    backgroundColor: Color.Gray.v100,
    borderRadius: Border.sm_8,
    width: '100%',
  },
  falseAlarmBadge: {
    backgroundColor: Color.Warning.amber + '20',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.Warning.amber,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs_4,
  },
  falseAlarmText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Warning.amber,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  injuryDetails: {
    backgroundColor: Color.Error.default + '08',
    padding: Spacing.sm_8,
    borderRadius: Border.sm_8,
    borderLeftWidth: 3,
    borderLeftColor: Color.Error.default,
  }
});

export default SosOccurrenceDetailsComponent;