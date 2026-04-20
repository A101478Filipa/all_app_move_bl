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

const MAX_VISIBLE_ITEMS = 3;

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

  if (!orderedCases.length) {
    return null;
  }

  const handleCasePress = (item: WoundOverviewCase) => {
    setIsModalVisible(false);
    onCasePress(item);
  };

  return (
    <VStack spacing={Spacing.md_16} style={styles.section}>
      <HStack spacing={Spacing.sm_8} align="center">
        <MaterialIcons name="healing" size={20} color={Color.primary} />
        <VStack align="flex-start" style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{t('dashboard.woundOverviewTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{t('dashboard.woundOverviewSubtitle')}</Text>
        </VStack>
      </HStack>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{overview.openCount}</Text>
          <Text style={styles.summaryLabel}>{t('dashboard.woundsOpen')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{overview.resolvedCount}</Text>
          <Text style={styles.summaryLabel}>{t('dashboard.woundsResolved')}</Text>
        </View>
      </View>

      <VStack spacing={Spacing.sm_12} style={{ alignSelf: 'stretch' }}>
        {orderedCases.slice(0, MAX_VISIBLE_ITEMS).map((item) => (
          <WoundCaseCard key={`${item.occurrenceType}-${item.occurrenceId}`} item={item} onPress={() => onCasePress(item)} />
        ))}
      </VStack>

      {orderedCases.length > MAX_VISIBLE_ITEMS && (
        <TouchableOpacity style={styles.moreItemsButton} onPress={() => setIsModalVisible(true)} activeOpacity={0.7}>
          <Text style={styles.moreItemsButtonText}>
            +{orderedCases.length - MAX_VISIBLE_ITEMS} {t('dashboard.moreWounds')}
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <HStack align="center" style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('dashboard.woundOverviewTitle')}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Color.Gray.v500} />
              </TouchableOpacity>
            </HStack>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{overview.openCount}</Text>
                <Text style={styles.summaryLabel}>{t('dashboard.woundsOpen')}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{overview.resolvedCount}</Text>
                <Text style={styles.summaryLabel}>{t('dashboard.woundsResolved')}</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalListContent}>
              <VStack spacing={Spacing.sm_12}>
                {orderedCases.map((item) => (
                  <WoundCaseCard
                    key={`modal-${item.occurrenceType}-${item.occurrenceId}`}
                    item={item}
                    onPress={() => handleCasePress(item)}
                  />
                ))}
              </VStack>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </VStack>
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
          <HStack align="center" style={styles.caseHeaderRow}>
            <Text style={styles.caseName}>{item.elderly.name}</Text>
            <View style={[styles.statusBadge, statusStyle]}>
              <Text style={[styles.statusBadgeText, statusTextStyle]}>
                {item.isResolved ? t('dashboard.woundsResolvedSingle') : t('dashboard.woundsOpenSingle')}
              </Text>
            </View>
          </HStack>

          <Text style={styles.caseMeta}>
            {item.occurrenceType === 'fall' ? t('dashboard.woundFromFall') : t('dashboard.woundFromSos')}
          </Text>

          {item.injuryDescription ? (
            <Text style={styles.caseDescription} numberOfLines={2}>{item.injuryDescription}</Text>
          ) : null}

          {item.latestTracking?.notes ? (
            <Text style={styles.caseTracking} numberOfLines={2}>{item.latestTracking.notes}</Text>
          ) : null}

          <Text style={styles.caseDate}>
            {t('dashboard.lastTrackingDate')}: {formatDateTime(item.latestTracking?.createdAt ?? item.occurrenceDate)}
          </Text>
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
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.Gray.v500,
  },
  sectionSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm_12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    padding: Spacing.md_16,
    ...shadowStyles.cardShadow,
  },
  summaryValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading3_24,
    color: Color.primary,
  },
  summaryLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
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
  caseDate: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
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
  moreItemsButton: {
    marginTop: Spacing.xs_4,
    backgroundColor: Color.white,
    borderWidth: 1.5,
    borderColor: Color.primary,
    borderRadius: Border.full,
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.md_16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreItemsButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Color.white,
    borderTopLeftRadius: Border.lg_16,
    borderTopRightRadius: Border.lg_16,
    maxHeight: '84%',
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
    paddingTop: Spacing.md_16,
    paddingBottom: Spacing.md_16,
  },
});

export default WoundOverviewWidget;