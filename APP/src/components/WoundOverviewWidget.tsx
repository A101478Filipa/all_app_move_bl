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
  const [activeTab, setActiveTab] = useState<'open' | 'resolved' | 'chart'>('open');
  const [sortMethod, setSortMethod] = useState<'date_desc' | 'date_asc'>('date_desc');

  // Monthly bar chart: all cases grouped by occurrenceDate (when the wound was registered)
  const monthlyBarData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const count = overview.cases.filter(c => {
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
  // "Este mês" = wounds registered this month (by occurrenceDate)
  const thisMonthAllCount = thisMonthCount;

  const openCases = useMemo(() => overview.cases.filter(c => !c.isResolved), [overview.cases]);
  const resolvedCases = useMemo(() => overview.cases.filter(c => c.isResolved), [overview.cases]);

  const sortedCases = useMemo(() => {
    const list = activeTab === 'open' ? openCases : (activeTab === 'resolved' ? resolvedCases : []);
    return [...list].sort((a, b) => {
      if (sortMethod === 'date_desc') return new Date(b.referenceDate).getTime() - new Date(a.referenceDate).getTime();
      if (sortMethod === 'date_asc') return new Date(a.referenceDate).getTime() - new Date(b.referenceDate).getTime();
      return 0;
    });
  }, [openCases, resolvedCases, activeTab, sortMethod]);

  const handleCasePress = (item: WoundOverviewCase) => {
    setIsModalVisible(false);
    onCasePress(item);
  };

  // Always render — even with 0 cases show the widget so the section headline is visible
  return (
    <View style={styles.section}>
      {/* ── Compact hero card ── */}
      <View style={styles.heroCard}>
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

        {/* Stats row — each card opens modal on its tab */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, styles.statCardOpen]}
            onPress={() => { setActiveTab('open'); setIsModalVisible(true); }}
            activeOpacity={0.75}
          >
            <Text style={[styles.statNumber, { color: Color.Orange.v500 }]}>{overview.openCount}</Text>
            <Text style={styles.statLabel}>{t('dashboard.woundsOpen')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, styles.statCardResolved]}
            onPress={() => { setActiveTab('resolved'); setIsModalVisible(true); }}
            activeOpacity={0.75}
          >
            <Text style={[styles.statNumber, { color: Color.Cyan.v500 }]}>{overview.resolvedCount}</Text>
            <Text style={styles.statLabel}>{t('dashboard.woundsResolved')}</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, styles.statCardMonth]}>
            <Text style={[styles.statNumber, { color: Color.primary }]}>{thisMonthAllCount}</Text>
            <Text style={styles.statLabel}>{t('dashboard.woundThisMonth')}</Text>
          </View>
        </View>

        {/* Footer */}
        <TouchableOpacity
          style={styles.heroFooter}
          onPress={() => { setActiveTab('open'); setIsModalVisible(true); }}
          activeOpacity={0.75}
        >
          <Text style={styles.heroFooterText}>{t('dashboard.woundSeeDetails')}</Text>
          <MaterialIcons name="chevron-right" size={18} color={Color.primary} />
        </TouchableOpacity>
      </View>

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

            {/* Tabs */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'open' && styles.tabActive]}
                onPress={() => setActiveTab('open')}
              >
                <Text style={[styles.tabText, activeTab === 'open' && styles.tabTextActive]}>
                  {t('dashboard.woundsOpen')} ({overview.openCount})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'resolved' && styles.tabActive]}
                onPress={() => setActiveTab('resolved')}
              >
                <Text style={[styles.tabText, activeTab === 'resolved' && styles.tabTextActive]}>
                  {t('dashboard.woundsResolved')} ({overview.resolvedCount})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, styles.tabIcon, activeTab === 'chart' && styles.tabActive]}
                onPress={() => setActiveTab('chart')}
              >
                <MaterialIcons name="bar-chart" size={18} color={activeTab === 'chart' ? Color.primary : Color.Gray.v400} />
              </TouchableOpacity>
            </View>

            {/* Sort chips — only for case tabs */}
            {activeTab !== 'chart' && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sortChipsContent}
              >
                <TouchableOpacity
                  style={[styles.filterChip, sortMethod === 'date_desc' && styles.filterChipActive]}
                  onPress={() => setSortMethod('date_desc')}
                >
                  <Text style={[styles.filterText, sortMethod === 'date_desc' && styles.filterTextActive]}>
                    {t('dashboard.sortDateNewest')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, sortMethod === 'date_asc' && styles.filterChipActive]}
                  onPress={() => setSortMethod('date_asc')}
                >
                  <Text style={[styles.filterText, sortMethod === 'date_asc' && styles.filterTextActive]}>
                    {t('dashboard.sortDateOldest')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Content */}
            {activeTab === 'chart' ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.sm_8, gap: Spacing.md_16 }}>
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
              </ScrollView>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flexShrink: 1 }}
                contentContainerStyle={{ paddingBottom: Spacing.lg_24, gap: Spacing.sm_12 }}
              >
                {sortedCases.length === 0 ? (
                  <Text style={styles.emptyText}>{t('dashboard.woundNoCases')}</Text>
                ) : (
                  sortedCases.map((item) => (
                    <WoundCaseCard
                      key={`modal-${item.occurrenceType}-${item.occurrenceId}`}
                      item={item}
                      onPress={() => handleCasePress(item)}
                    />
                  ))
                )}
              </ScrollView>
            )}
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
    padding: Spacing.sm_8,
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
    fontSize: FontSize.bodylarge_18,
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Color.Gray.v100,
    borderRadius: Border.md_12,
    padding: 4,
    gap: 4,
    marginBottom: Spacing.sm_8,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: Border.sm_8,
  },
  tabIcon: {
    flex: 0,
    paddingHorizontal: Spacing.sm_8,
  },
  tabActive: {
    backgroundColor: Color.white,
    ...shadowStyles.cardShadow,
  },
  tabText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  tabTextActive: {
    fontFamily: FontFamily.bold,
    color: Color.primary,
  },
  sortChipsContent: {
    gap: 8,
    paddingBottom: Spacing.sm_8,
    paddingHorizontal: 2,
  },
  filterChip: {
    paddingVertical: Spacing.xs_4 + 2,
    paddingHorizontal: Spacing.md_16,
    borderRadius: Border.full,
    backgroundColor: Color.Gray.v100,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  filterChipActive: {
    backgroundColor: Color.primary + '1A',
    borderColor: Color.primary,
  },
  filterText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
  },
  filterTextActive: {
    fontFamily: FontFamily.bold,
    color: Color.primary,
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
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v300,
    textAlign: 'center',
    paddingVertical: Spacing.md_16,
  },
  // ── Case cards ──
  caseCard: {
    alignSelf: 'stretch',
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