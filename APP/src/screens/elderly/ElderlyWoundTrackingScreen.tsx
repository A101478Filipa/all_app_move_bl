import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import WoundTrackingComponent from '@components/WoundTrackingComponent';
import { useAuthStore } from '@src/stores/authStore';
import { UserRole } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { spacingStyles, Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { MaterialIcons } from '@expo/vector-icons';
import { shadowStyles } from '@src/styles/shadow';
import { Border } from '@src/styles/borders';
import { woundTrackingApi, WoundCase } from '@src/api/endpoints/woundTracking';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<any, 'ElderlyWoundTrackingScreen'>;

const ElderlyWoundTrackingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { elderlyId } = route.params;
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const role = user?.user?.role;

  const isPrivileged = [
    UserRole.INSTITUTION_ADMIN,
    UserRole.CAREGIVER,
    UserRole.CLINICIAN,
    UserRole.PROGRAMMER,
  ].includes(role as UserRole);

  const [cases, setCases] = useState<WoundCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);

  useEffect(() => {
    woundTrackingApi.getElderlyWoundCases(elderlyId)
      .then(res => setCases(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCases([]))
      .finally(() => setCasesLoading(false));
  }, [elderlyId]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleCasePress = (item: WoundCase) => {
    if (item.occurrenceType === 'fall') {
      navigation.push('FallOccurrenceScreen', { occurrenceId: item.occurrenceId });
    } else {
      navigation.push('SosOccurrenceScreen', { occurrenceId: item.occurrenceId });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Section 1: Injury cases from falls and SOS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="warning" size={20} color={Color.Orange.v500} />
            <Text style={styles.sectionTitle}>{t('woundTracking.injuryCasesTitle')}</Text>
          </View>

          {casesLoading ? (
            <ActivityIndicator size="small" color={Color.primary} style={{ marginVertical: Spacing.md_16 }} />
          ) : cases.length === 0 ? (
            <Text style={styles.emptyText}>{t('woundTracking.noInjuryCases')}</Text>
          ) : (
            cases.map(item => (
              <TouchableOpacity
                key={`${item.occurrenceType}-${item.occurrenceId}`}
                style={styles.caseCard}
                onPress={() => handleCasePress(item)}
                activeOpacity={0.75}
              >
                <View style={styles.caseCardContent}>
                  <View style={styles.caseLeft}>
                    <View style={styles.caseTypeRow}>
                      <MaterialIcons
                        name={item.occurrenceType === 'fall' ? 'accessibility-new' : 'sos'}
                        size={16}
                        color={Color.Gray.v500}
                      />
                      <Text style={styles.caseTypeLabel}>
                        {item.occurrenceType === 'fall'
                          ? t('fallOccurrence.title')
                          : t('sosOccurrence.title')}
                      </Text>
                    </View>
                    <Text style={styles.caseDate}>{formatDate(item.occurrenceDate)}</Text>
                    {item.injuryDescription ? (
                      <Text style={styles.caseDescription} numberOfLines={2}>{item.injuryDescription}</Text>
                    ) : null}
                  </View>
                  <View style={styles.caseRight}>
                    <View style={[styles.statusBadge, item.isResolved ? styles.statusResolved : styles.statusOngoing]}>
                      <Text style={[styles.statusText, item.isResolved ? styles.statusResolvedText : styles.statusOngoingText]}>
                        {item.isResolved ? t('woundTracking.resolved') : t('woundTracking.ongoing')}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={Color.Gray.v400} style={{ marginTop: 4 }} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Section 2: Direct wound tracking entries (not linked to a fall or SOS) */}
        <WoundTrackingComponent
          occurrenceId={elderlyId}
          occurrenceType="elderly"
          canAdd={isPrivileged}
          canDelete={isPrivileged}
        />

      </ScrollView>
    </View>
  );
};

export default ElderlyWoundTrackingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  content: {
    ...spacingStyles.screenScrollContainer,
    gap: Spacing.lg_24,
  },
  section: {
    gap: Spacing.sm_8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs_4,
    marginBottom: Spacing.xs_4,
  },
  sectionTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodylarge_18 - 2,
    color: Color.dark,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    textAlign: 'center',
    paddingVertical: Spacing.md_16,
  },
  caseCard: {
    backgroundColor: Color.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    marginBottom: Spacing.sm_8,
    ...shadowStyles.cardShadow,
  },
  caseCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm_8,
  },
  caseLeft: {
    flex: 1,
    gap: 2,
  },
  caseTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  caseTypeLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caseDate: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
    marginTop: 2,
  },
  caseDescription: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    marginTop: 2,
  },
  caseRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Border.full,
  },
  statusOngoing: {
    backgroundColor: Color.Orange.v100,
  },
  statusResolved: {
    backgroundColor: Color.Cyan.v100,
  },
  statusText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.caption_12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusOngoingText: {
    color: Color.Orange.v500,
  },
  statusResolvedText: {
    color: Color.Cyan.v500,
  },
});
