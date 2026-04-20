import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { BarChart } from 'react-native-gifted-charts';
import { InstitutionWoundOverview, WoundOverviewCase } from '@src/api/endpoints/institution';
import { buildAvatarUrl } from '@src/services/ApiService';
import { Color } from '@src/styles/colors';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { shadowStyles } from '@src/styles/shadow';
import { Spacing } from '@src/styles/spacings';
import { HStack, VStack } from './CoreComponents';
import { useTranslation } from '@src/localization/hooks/useTranslation';

type Props = {
  overview: InstitutionWoundOverview;
  onCasePress: (item: WoundOverviewCase) => void;
};

export const WoundOverviewWidget: React.FC<Props> = ({ overview, onCasePress }) => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const orderedCases = useMemo(() => {
    return [...overview.cases].sort((left, right) => {
      if (left.isResolved !== right.isResolved) {
        return Number(left.isResolved) - Number(right.isResolved);
      }
      return new Date(right.referenceDate).getTime() - new Date(left.referenceDate).getTime();
    });
  }, [overview.cases]);

  // Monthly bar chart data: last 6 months
  const monthlyBarData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const count = overview.cases.filter(c => {
        if (c.isResolved) return false;
        const cd = new Date(c.occurrenceDate);
        return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
      }).length;
      const label = d.toLocaleDateString('pt-PT', { month: 'short' });
      return {
        value: count,
        label: label.replace('.', ''),
        frontColor: count === 0 ? Color.Gray.v200 : Color.primary,
      };
    });
  }, [overview.cases]);

  const lastMonthCount = monthlyBarData[4]?.value ?? 0;
  const thisMonthCount = monthlyBarData[5]?.value ?? 0;
  const maxBarValue = Math.max(...monthlyBarData.map(d => d.value), 2);

  const handleCasePress = (item: WoundOverviewCase) => {
    setIsModalVisible(false);
    onCasePress(item);
  };

  // Always render — even with 0 cases show the widget so the section headline is visible
  return (
    <View style={styles.section}>
      {/* ── Compact hero card ── */}
      <TouchableOpacity
        style={styles.heroCard}
        activeOpacity={0.85}
        onPress={() => setIsModalVisible(true)}
      >
        {/* Header */}
        <HStack spacing={Spacing.sm_8} align="center" style={styles.heroHeader}>
          <View style={styles.heroIconBg}>
            <MaterialIcons name="healing" size={22} color={Color.primary} />
          </View>
          <VStack align="flex-start" style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{t('dashboard.woundOverviewTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('dashboard.woundOverviewSubtitle')}</Text>
          </VStack>
          {overview.openCount > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{overview.openCount}</Text>
            </View>
          )}
        </HStack>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardOpen]}>
            <Text style={[styles.statNumber, { color: Color.Orange.v500 }]}>{overview.openCount}</Text>
            <Text style={styles.statLabel}>{t('dashboard.woundsOpen')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardResolved]}>
            <Text style={[styles.statNumber, { color: Color.Cyan.v500 }]}>{overview.resolvedCount}</Text>
            <Text style={styles.statLabel}>{t('dashboard.woundsResolved')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMonth]}>
            <Text style={[styles.statNumber, { color: Color.primary }]}>{thisMonthCount}</Text>
            <Text style={styles.statLabel}>{t('dashboard.woundThisMonth')}</Text>
          </View>
        </View>

        {/* Footer */}
        <HStack style={styles.heroFooter} align="center">
          <Text style={styles.heroFooterText}>{t('dashboard.woundSeeDetails')}</Text>
          <MaterialIcons name="chevron-right" size={18} color={Color.primary} />
        </HStack>
      </TouchableOpacity>

      {/* ── Full detail modal ── */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal header */}
            <HStack align="center" style={styles.modalHeader}>
              <HStack spacing={Spacing.sm_8} align="center" style={{ flex: 1 }}>
                <MaterialIcons name="healing" size={20} color={Color.primary} />
                <Text style={styles.modalTitle}>{t('dashboard.woundOverviewTitle')}</Text>
              </HStack>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Color.Gray.v500} />
              </TouchableOpacity>
            </HStack>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalListContent}>
              {/* Summary stats */}
              <View style={styles.modalStatsRow}>
                <View style={[styles.modalStatCard, { borderColor: Color.Orange.v200 }]}>
                  <Text style={[styles.modalStatNumber, { color: Color.Orange.v500 }]}>{overview.openCount}</Text>
                  <Text style={styles.modalStatLabel}>{t('dashboard.woundsOpen')}</Text>
                </View>
                <View style={[styles.modalStatCard, { borderColor: Color.Cyan.v200 }]}>
                  <Text style={[styles.modalStatNumber, { color: Color.Cyan.v500 }]}>{overview.resolvedCount}</Text>
                  <Text style={styles.modalStatLabel}>{t('dashboard.woundsResolved')}</Text>
                </View>
              </View>

              {/* Monthly chart */}
              <View style={styles.chartSection}>
                <HStack align="center" style={styles.chartHeader} spacing={Spacing.xs_4}>
                  <MaterialIcons name="bar-chart" size={18} color={Color.primary} />
                  <Text style={styles.chartTitle}>{t('dashboard.woundMonthlyChart')}</Text>
                </HStack>

                <View style={styles.chartBadgesRow}>
                  <View style={styles.chartBadge}>
                    <Text style={styles.chartBadgeText}>
                      {t('dashboard.woundLastMonth')}: <Text style={{ color: Color.primary, fontFamily: FontFamily.bold }}>{lastMonthCount}</Text>
                    </Text>
                  </View>
                  <View style={styles.chartBadge}>
                    <Text style={styles.chartBadgeText}>
                      {t('dashboard.woundThisMonth')}: <Text style={{ color: Color.primary, fontFamily: FontFamily.bold }}>{thisMonthCount}</Text>
                    </Text>
                  </View>
                </View>

                <BarChart
                  data={monthlyBarData}
                  barWidth={32}
                  barBorderRadius={6}
                  spacing={18}
                  noOfSections={3}
                  maxValue={maxBarValue + 1}
                  xAxisThickness={1}
                  xAxisColor={Color.Gray.v200}
                  yAxisThickness={0}
                  yAxisTextStyle={{ color: Color.Gray.v400, fontSize: 10, fontFamily: FontFamily.regular }}
                  xAxisLabelTextStyle={{ color: Color.Gray.v400, fontSize: 10, fontFamily: FontFamily.regular }}
                  isAnimated
                  disablePress
                />
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Case list */}
              {orderedCases.length === 0 ? (
                <Text style={styles.emptyText}>{t('dashboard.woundNoCases')}</Text>
              ) : (
                <VStack spacing={Spacing.sm_12}>
                  {orderedCases.map((item) => (
                    <WoundCaseCard
                      key={`modal-${item.occurrenceType}-${item.occurrenceId}`}
                      item={item}
                      onPress={() => handleCasePress(item)}
                    />
                  ))}
                </VStack>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const WoundCaseCard: React.FC<{ item: WoundOverviewCase; onPress: () => void }> = ({ item, onPress }) => {
  const { t } = useTranslation();
  const avatarUrl = item.elderly.avatarUrl ? buildAvatarUrl(item.elderly.avatarUrl) : null;
  const statusStyle = item.isResolved ? styles.statusResolved : styles.statusOpen;
  const statusTextStyle = item.isResolved ? styles.statusResolvedText : styles.statusOpenText;

  return (
    <TouchableOpacity style={styles.caseCard} onPress={onPress} activeOpacity={0.75}>
      <HStack spacing={Spacing.sm_12} align="flex-start">
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{item.elderly.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <VStack align="flex-start" style={styles.caseBody} spacing={Spacing.xs_4}>
          {/* Name + status */}
          <HStack align="center" style={styles.caseHeaderRow}>
            <Text style={styles.caseName}>{item.elderly.name}</Text>
            <View style={[styles.statusBadge, statusStyle]}>
              <Text style={[styles.statusBadgeText, statusTextStyle]}>
                {item.isResolved ? t('dashboard.woundsResolvedSingle') : t('dashboard.woundsOpenSingle')}
              </Text>
            </View>
          </HStack>

          {/* Occurrence date */}
          <HStack spacing={Spacing.xs_4} align="center">
            <MaterialIcons name="event" size={13} color={Color.Gray.v400} />
            <Text style={styles.caseOccurrenceDate}>
              {item.occurrenceType === 'fall' ? t('dashboard.woundFromFall') : t('dashboard.woundFromSos')} · {formatDateTime(item.occurrenceDate)}
            </Text>
          </HStack>

          {/* injury description */}
          {item.injuryDescription ? (
            <Text style={styles.caseDescription} numberOfLines={2}>{item.injuryDescription}</Text>
          ) : null}

          {/* latest tracking update */}
          {item.latestTracking ? (
            <View style={styles.latestTrackingBox}>
              <HStack spacing={Spacing.xs_4} align="center">
                <MaterialIcons name="update" size={12} color={Color.primary} />
                <Text style={styles.latestTrackingLabel}>{t('dashboard.lastTrackingDate')}: {formatDateTime(item.latestTracking.createdAt)}</Text>
              </HStack>
              {item.latestTracking.notes ? (
                <Text style={styles.caseTracking} numberOfLines={2}>{item.latestTracking.notes}</Text>
              ) : null}
            </View>
          ) : null}
        </VStack>

        <MaterialIcons name="chevron-right" size={20} color={Color.Gray.v400} />
      </HStack>
    </TouchableOpacity>
  );
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  section: {
    alignSelf: 'stretch',
    marginBottom: Spacing.xl_32,
  },
  // ── Hero card ──
  heroCard: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    padding: Spacing.md_16,
    ...shadowStyles.cardShadow,
    gap: Spacing.md_16,
  },
  heroHeader: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  heroIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Color.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.Gray.v500,
  },
  heroSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  alertBadge: {
    backgroundColor: Color.Orange.v500,
    borderRadius: Border.full,
    minWidth: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs_4,
  },
  alertBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm_8,
  },
  statCard: {
    flex: 1,
    borderRadius: Border.md_12,
    padding: Spacing.sm_12,
    alignItems: 'center',
    gap: 2,
  },
  statCardOpen: {
    backgroundColor: Color.Orange.v100,
  },
  statCardResolved: {
    backgroundColor: Color.Cyan.v100,
  },
  statCardMonth: {
    backgroundColor: Color.primary + '10',
  },
  statNumber: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading3_24,
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  heroFooter: {
    justifyContent: 'flex-end',
    gap: 2,
  },
  heroFooterText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.primary,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Color.white,
    borderTopLeftRadius: Border.xl_24,
    borderTopRightRadius: Border.xl_24,
    maxHeight: '90%',
    padding: Spacing.md_16,
    paddingBottom: Spacing.xl_32,
  },
  modalHeader: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md_16,
    paddingBottom: Spacing.sm_8,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v200,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading3_24,
    color: Color.primary,
  },
  closeButton: {
    padding: Spacing.xs_4,
  },
  modalListContent: {
    paddingTop: Spacing.sm_8,
    paddingBottom: Spacing.lg_24,
    gap: Spacing.md_16,
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm_12,
  },
  modalStatCard: {
    flex: 1,
    borderRadius: Border.md_12,
    borderWidth: 1.5,
    padding: Spacing.md_16,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Color.Background.white,
  },
  modalStatNumber: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading2_28,
  },
  modalStatLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  // ── Chart section ──
  chartSection: {
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    gap: Spacing.sm_8,
  },
  chartHeader: {
    marginBottom: 2,
  },
  chartTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  chartBadgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm_8,
    marginBottom: Spacing.sm_8,
  },
  chartBadge: {
    backgroundColor: Color.white,
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: 4,
    ...shadowStyles.cardShadow,
  },
  chartBadgeText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  divider: {
    height: 1,
    backgroundColor: Color.Gray.v100,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v300,
    textAlign: 'center',
    paddingVertical: Spacing.md_16,
  },
  // ── Case cards ──
  caseCard: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    padding: Spacing.md_16,
    ...shadowStyles.cardShadow,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Color.Background.cyanTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.primary,
  },
  caseBody: {
    flex: 1,
  },
  caseHeaderRow: {
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    gap: Spacing.sm_8,
  },
  caseName: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  caseMeta: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.primary,
  },
  caseDescription: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
  },
  caseTracking: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  caseOccurrenceDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
  },
  latestTrackingBox: {
    backgroundColor: Color.primary + '0D',
    borderRadius: Border.sm_8,
    padding: Spacing.xs_4 + 2,
    gap: 2,
    alignSelf: 'stretch',
  },
  latestTrackingLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.primary,
  },
  statusBadge: {
    borderRadius: Border.full,
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.caption_12,
  },
  statusOpen: {
    backgroundColor: Color.Orange.v100,
  },
  statusOpenText: {
    color: Color.Orange.v500,
  },
  statusResolved: {
    backgroundColor: Color.Cyan.v100,
  },
  statusResolvedText: {
    color: Color.Cyan.v500,
  },
});

export default WoundOverviewWidget;