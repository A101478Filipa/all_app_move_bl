import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, SafeAreaView, Modal, TouchableOpacity } from 'react-native';
import { FallOccurrence, SosOccurrence, UserRole } from 'moveplus-shared';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { Color } from '@src/styles/colors';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import ScreenState from '@src/constants/screenState';
import { shadowStyles } from '@src/styles/shadow';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InstitutionDashboardNavigationStackParamList } from '../../navigation/InstitutionDashboardNavigationStack';
import { useInstitutionDashboardStore, useCaregiverDashboardStore } from '@src/stores';
import { useFocusEffect } from '@react-navigation/core';
import { useCallback } from 'react';
import FallOccurrenceCard from '@src/components/FallOccurrenceCard';
import SosOccurrenceCard from '@src/components/SosOccurrenceCard';
import { VStack, HStack } from '@components/CoreComponents';
import { useAuthStore } from '@src/stores';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { PendingDataAccessRequestsWidget } from '@components/PendingDataAccessRequestsWidget';
import { calculateFallRiskScore } from '@src/utils/fallRiskCalculator';
import { UpcomingBirthdaysWidget } from '@components/UpcomingBirthdaysWidget';
import { WoundOverviewCase } from '@src/api/endpoints/institution';
import { WoundOverviewWidget } from '@components/WoundOverviewWidget';

// MARK: Types
type Props = NativeStackScreenProps<InstitutionDashboardNavigationStackParamList, 'InstitutionDashboardScreen'>;

type DashboardWidgetProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
};

// MARK: Components
const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  disabled = false,
  color = Color.primary
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.widget,
        disabled && styles.widgetDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <HStack spacing={Spacing.md_16} align="center">
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        <VStack align="flex-start" style={{ flex: 1 }}>
          <Text style={[styles.widgetTitle, disabled && styles.widgetTitleDisabled]}>
            {title}
          </Text>
          <Text style={[styles.widgetSubtitle, disabled && styles.widgetSubtitleDisabled]}>
            {subtitle}
          </Text>
        </VStack>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={disabled ? Color.Gray.v300 : Color.Gray.v400}
        />
      </HStack>
    </TouchableOpacity>
  );
};

const UnhandledFallsSection: React.FC<{
  fallOccurrences: FallOccurrence[];
  onFallPress: (item: FallOccurrence) => void;
}> = ({ fallOccurrences, onFallPress }) => {
  const { t } = useTranslation();
  const maxItemsToShow = 1;
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Guarda a ordenação atual ('date_desc', 'date_asc', 'age', ou 'risk')
  const [sortMethod, setSortMethod] = useState<'date_desc' | 'date_asc' | 'age' | 'risk'>('date_desc');

  const unhandledFalls = fallOccurrences.filter(fall => {
    return (fall.handlerUserId === undefined || fall.handlerUserId === null) && 
           (fall.handler === null || fall.handler === undefined);
  });

  // Count falls per elderly from available data (used as risk proxy)
  const fallCountByElderly = useMemo(() =>
    fallOccurrences.reduce<Record<number, number>>((acc, f) => {
      acc[f.elderlyId] = (acc[f.elderlyId] || 0) + 1;
      return acc;
    }, {})
  , [fallOccurrences]);

  // Ordenar a lista consoante o botão escolhido
  const sortedFalls = [...unhandledFalls].sort((a, b) => {
    if (sortMethod === 'date_desc' || sortMethod === 'date_asc') {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return sortMethod === 'date_desc' ? dateB - dateA : dateA - dateB;
    }
    
    if (sortMethod === 'age') {
      // Oldest patient (earliest birthdate) first
      const birthA = new Date(a.elderly?.birthDate || 0).getTime();
      const birthB = new Date(b.elderly?.birthDate || 0).getTime();
      return birthA - birthB;
    }

    if (sortMethod === 'risk') {
      // Age-based risk + fall count bonus (5pts per unhandled fall, max 20)
      const baseA = a.elderly ? calculateFallRiskScore(a.elderly) : 0;
      const baseB = b.elderly ? calculateFallRiskScore(b.elderly) : 0;
      const bonusA = Math.min((fallCountByElderly[a.elderlyId] || 0) * 5, 20);
      const bonusB = Math.min((fallCountByElderly[b.elderlyId] || 0) * 5, 20);
      return (baseB + bonusB) - (baseA + bonusA);
    }

    return 0;
  });

  const handleFallPressFromModal = (item: FallOccurrence) => {
    setIsModalVisible(false);
    onFallPress(item);
  };

  if (unhandledFalls.length === 0) {
    return null; // Se não houver quedas, não mostra a secção
  }

  return (
    <VStack spacing={Spacing.md_16} style={styles.section}>
      <HStack spacing={Spacing.sm_8} align="center" >
        <MaterialIcons name="warning" size={20} color={Color.Error.default} />

        <VStack align="flex-start" style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: Color.Error.default }]}>
            {t('dashboard.unhandledFalls')} ({unhandledFalls.length})
          </Text>
          <Text style={styles.sectionSubtitle}>{t('dashboard.tapToHandle')}</Text>
        </VStack>
      </HStack>

      {/* Mostra apenas 1 queda diretamente no ecrã (Dashboard) */}
      {sortedFalls.slice(0, maxItemsToShow).map((fall) => (
        <FallOccurrenceCard
          key={fall.id}
          item={fall}
          onPress={(item) => onFallPress(item)}
        />
      ))}

      {/* Tornar o texto clicável com TouchableOpacity */}
      {unhandledFalls.length > maxItemsToShow && (
        <TouchableOpacity 
          style={styles.moreItemsButton} 
          onPress={() => setIsModalVisible(true)} 
          activeOpacity={0.7}
        >
          <Text style={styles.moreItemsButtonText}>
            +{unhandledFalls.length - maxItemsToShow} {t('dashboard.moreFalls')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Modal com a lista scrollable de TODAS as quedas */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <HStack align="center" style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('dashboard.unhandledFalls')} ({unhandledFalls.length})
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Color.Gray.v500} />
              </TouchableOpacity>
            </HStack>

          {/* BOTÕES DE ORDENAÇÃO */}

            <View style={styles.filterContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ gap: 8, paddingBottom: 8, paddingRight: 16 }}
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

                <TouchableOpacity 
                  style={[styles.filterChip, sortMethod === 'risk' && styles.filterChipActive]}
                  onPress={() => setSortMethod('risk')}
                >
                  <Text style={[styles.filterText, sortMethod === 'risk' && styles.filterTextActive]}>
                    {t('dashboard.sortFallRisk')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.filterChip, sortMethod === 'age' && styles.filterChipActive]}
                  onPress={() => setSortMethod('age')}
                >
                  <Text style={[styles.filterText, sortMethod === 'age' && styles.filterTextActive]}>
                    {t('dashboard.sortPatientAge')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* USAR A LISTA ORDENADA */}
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={{ flexShrink: 1 }} // Impede que a lista empurre os filtros para fora
              contentContainerStyle={{ paddingBottom: Spacing.lg_24 }} 
            >
              <VStack spacing={Spacing.md_16}>
                {sortedFalls.map((fall) => (
                  <FallOccurrenceCard
                    key={`modal-${fall.id}`}
                    item={fall}
                    onPress={(item) => handleFallPressFromModal(item)}
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

const SOS_COLOR = Color.Warning.amber;

const UnhandledSosSection: React.FC<{
  sosOccurrences: SosOccurrence[];
  onSosPress: (item: SosOccurrence) => void;
}> = ({ sosOccurrences, onSosPress }) => {
  const { t } = useTranslation();
  const maxItemsToShow = 1;
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleFallPressFromSos = (item: SosOccurrence) => {
    setIsModalVisible(false);
    onSosPress(item);
  };

  // Guarda a ordenação atual ('date_desc', 'date_asc', 'age', ou 'risk')
  const [sortMethod, setSortMethod] = useState<'date_desc' | 'date_asc' | 'age' | 'risk'>('date_desc');

  const unhandledSOS = sosOccurrences.filter(sos => {
    return (sos.handlerUserId === undefined || sos.handlerUserId === null) && 
           (sos.handler === null || sos.handler === undefined);
  });

  // Count SOS per elderly from available data (used as risk proxy)
  const sosCountByElderly = useMemo(() =>
    sosOccurrences.reduce<Record<number, number>>((acc, s) => {
      acc[s.elderlyId] = (acc[s.elderlyId] || 0) + 1;
      return acc;
    }, {})
  , [sosOccurrences]);

  // Ordenar a lista consoante o botão escolhido
  const sortedSOS = [...unhandledSOS].sort((a, b) => {
    if (sortMethod === 'date_desc' || sortMethod === 'date_asc') {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return sortMethod === 'date_desc' ? dateB - dateA : dateA - dateB;
    }
    
    if (sortMethod === 'age') {
      // Oldest patient (earliest birthdate) first
      const birthA = new Date(a.elderly?.birthDate || 0).getTime();
      const birthB = new Date(b.elderly?.birthDate || 0).getTime();
      return birthA - birthB;
    }

    if (sortMethod === 'risk') {
      // Age-based risk + SOS count bonus (5pts per SOS, max 20)
      const baseA = a.elderly ? calculateFallRiskScore(a.elderly) : 0;
      const baseB = b.elderly ? calculateFallRiskScore(b.elderly) : 0;
      const bonusA = Math.min((sosCountByElderly[a.elderlyId] || 0) * 5, 20);
      const bonusB = Math.min((sosCountByElderly[b.elderlyId] || 0) * 5, 20);
      return (baseB + bonusB) - (baseA + bonusA);
    }

    return 0;
  });

  if (unhandledSOS.length === 0) return null;

  return (
    <VStack spacing={Spacing.md_16} style={styles.section}>
      <HStack spacing={Spacing.sm_8} align="center">
        <MaterialIcons name="sos" size={20} color={SOS_COLOR} />
        <VStack align="flex-start" style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: SOS_COLOR }]}>
            {t('dashboard.unhandledSos')} ({unhandledSOS.length})
          </Text>
          <Text style={styles.sectionSubtitle}>{t('dashboard.tapToHandle')}</Text>
        </VStack>
      </HStack>

      {/* Mostra apenas 1 SOS diretamente no ecrã (Dashboard) */}
      {sortedSOS.slice(0, maxItemsToShow).map((sos) => (
        <SosOccurrenceCard
          key={sos.id}
          item={sos}
          onPress={(item) => onSosPress(item)}
        />
      ))}

      {/* Tornar o texto clicável com TouchableOpacity */}
      {unhandledSOS.length > maxItemsToShow && (
        <TouchableOpacity 
          style={[styles.moreItemsButton, { borderColor: SOS_COLOR }]} 
          onPress={() => setIsModalVisible(true)} 
          activeOpacity={0.7}
        >
          <Text style={[styles.moreItemsButtonText, { color: SOS_COLOR }]}>
            +{unhandledSOS.length - maxItemsToShow} {t('dashboard.moreSos')}

          </Text>
        </TouchableOpacity>
      )}

      {/* Modal com a lista scrollable de TODAS as quedas */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <HStack align="center" style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('dashboard.unhandledSos')} ({unhandledSOS.length})
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Color.Gray.v500} />
              </TouchableOpacity>
            </HStack>

          {/* BOTÕES DE ORDENAÇÃO */}

            <View style={styles.filterContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ gap: 8, paddingBottom: 8, paddingRight: 16 }}
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

                <TouchableOpacity 
                  style={[styles.filterChip, sortMethod === 'risk' && styles.filterChipActive]}
                  onPress={() => setSortMethod('risk')}
                >
                  <Text style={[styles.filterText, sortMethod === 'risk' && styles.filterTextActive]}>
                    {t('dashboard.sortFallRisk')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.filterChip, sortMethod === 'age' && styles.filterChipActive]}
                  onPress={() => setSortMethod('age')}
                >
                  <Text style={[styles.filterText, sortMethod === 'age' && styles.filterTextActive]}>
                    {t('dashboard.sortPatientAge')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* USAR A LISTA ORDENADA */}
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={{ flexShrink: 1 }} // Impede que a lista empurre os filtros para fora
              contentContainerStyle={{ paddingBottom: Spacing.lg_24 }} 
            >
              <VStack spacing={Spacing.md_16}>
                {sortedSOS.map((sos) => (
                  <SosOccurrenceCard
                    key={`modal-${sos.id}`}
                    item={sos}
                    onPress={(item) => handleFallPressFromSos(item)}
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

// MARK: Screen
const InstitutionDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { sections, sosOccurrences, woundOverview, fetch, refresh, state } = useInstitutionDashboardStore();
  const {
    pendingAccessRequests,
    state: caregiverDashboardState,
    fetch: fetchCaregiverRequests,
    removeRequest 
  } = useCaregiverDashboardStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const isCaregiver = user?.user?.role === UserRole.CAREGIVER || user?.user?.role === UserRole.INSTITUTION_ADMIN;

  useFocusEffect(
    useCallback(() => {
      fetch();
      if (isCaregiver) {
        fetchCaregiverRequests();
      }
    }, [isCaregiver])
  );

  const onFallPress = useCallback(
    (item: FallOccurrence) => {
      navigation.push('FallOccurrenceScreen', { occurrenceId: item.id });
    }, [navigation]
  );

  const onSosPress = useCallback(
    (item: SosOccurrence) => {
      navigation.push('SosOccurrenceScreen', { occurrenceId: item.id });
    }, [navigation]
  );

  const handleAddMeasurement = useCallback(() => {
    navigation.navigate('SelectElderlyScreen');
  }, [navigation]);

  const handleStartSession = useCallback(() => {
    // TODO: Implement session start functionality
    console.log('Start session pressed');
  }, []);

  const handleViewTimeline = useCallback(() => {
    navigation.push('InstitutionTimelineScreen');
  }, [navigation]);

  const handleViewMyCalendar = useCallback(() => {
    const userId = user?.user?.id;
    const name = user?.name;
    if (userId) {
      navigation.push('ProfessionalCalendar', { userId, professionalName: name, isAdmin: true });
    }
  }, [navigation, user]);

  const handleViewBathSchedule = useCallback(() => {
    navigation.push('BathSchedule');
  }, [navigation]);

  const handleWoundCasePress = useCallback((item: WoundOverviewCase) => {
    if (item.occurrenceType === 'fall') {
      navigation.push('FallOccurrenceScreen', { occurrenceId: item.occurrenceId });
      return;
    }

    navigation.push('SosOccurrenceScreen', { occurrenceId: item.occurrenceId });
  }, [navigation]);


  if (state === ScreenState.LOADING) {
    return <ActivityIndicatorOverlay/>
  }

  if (state === ScreenState.ERROR) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{t('errors.serverError')}</Text>
      </SafeAreaView>
    );
  }

  const allFallOccurrences = sections.flatMap(section => section.data);
  const unhandledFalls = allFallOccurrences.filter(fall =>
    (fall.handlerUserId === undefined || fall.handlerUserId === null) &&
    (fall.handler === null || fall.handler === undefined)
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior='automatic'
        refreshControl={
          <RefreshControl refreshing={state === ScreenState.REFRESHING} onRefresh={refresh} />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Unhandled Falls Section */}
        {unhandledFalls.length > 0 && (
          <UnhandledFallsSection
            fallOccurrences={unhandledFalls}
            onFallPress={onFallPress}
          />
        )}

        {/* Unhandled SOS Alerts Section */}
        <UnhandledSosSection
          sosOccurrences={sosOccurrences}
          onSosPress={onSosPress}
        />

        {/* Pending Data Access Requests for Caregivers */}
        {isCaregiver && (
          <PendingDataAccessRequestsWidget
            requests={pendingAccessRequests}
            state={caregiverDashboardState}
            onRequestResponded={removeRequest}
            userRole={user?.user?.role}
          />
        )}

        {/* Wound Tracking Overview */}
        <WoundOverviewWidget
          overview={woundOverview}
          onCasePress={handleWoundCasePress}
        />

        {/* Upcoming Birthdays */}
        <UpcomingBirthdaysWidget
          onElderlyPress={(elderly) => navigation.push('ElderlyDetails', { elderlyId: elderly.id, name: elderly.name })}
        />

        {/* Quick Actions Section */}
        <VStack spacing={Spacing.sm_8} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>

          <VStack style={{ alignSelf: 'stretch' }} spacing={Spacing.md_16}>
            <DashboardWidget
              title={t('dashboard.addMeasurement')}
              subtitle={t('dashboard.recordHealthData')}
              icon={<MaterialIcons name="monitor-heart" size={24} color={Color.primary} />}
              onPress={handleAddMeasurement}
              color={Color.primary}
            />

            <DashboardWidget
              title={t('dashboard.myCalendar')}
              subtitle={t('dashboard.myCalendarSubtitle')}
              icon={<MaterialIcons name="calendar-today" size={24} color={Color.secondary} />}
              onPress={handleViewMyCalendar}
              color={Color.secondary}
            />

            <DashboardWidget
              title={t('dashboard.bathSchedule')}
              subtitle={t('dashboard.bathScheduleSubtitle')}
              icon={<MaterialIcons name="shower" size={24} color="#0288D1" />}
              onPress={handleViewBathSchedule}
              color="#0288D1"
            />

            <DashboardWidget
              title={t('dashboard.viewTimeline')}
              subtitle={t('dashboard.seeActivityHistory')}
              icon={<MaterialIcons name="timeline" size={24} color={Color.secondary} />}
              onPress={handleViewTimeline}
              color={Color.secondary}
            />

            <DashboardWidget
              title={t('dashboard.startSession')}
              subtitle={t('dashboard.comingSoon')}
              icon={<MaterialIcons name="play-circle-outline" size={24} color={Color.Gray.v400} />}
              onPress={handleStartSession}
              disabled={true}
              color={Color.Gray.v400}
            />
          </VStack>
        </VStack>
      </ScrollView>
    </View>
  );
};

// MARK: Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  scrollContent: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
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
  sectionSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
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
    maxHeight: '80%',                    
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
    color: Color.Error.default,
  },
  closeButton: {
    padding: Spacing.xs_4,
  },
  widget: {
    backgroundColor: Color.white,
    padding: Spacing.md_16,
    borderRadius: Border.lg_16,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
  },
  widgetDisabled: {
    opacity: 0.6,
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
  widgetTitleDisabled: {
    color: Color.Gray.v400,
  },
  widgetSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  widgetSubtitleDisabled: {
    color: Color.Gray.v300,
  },
  noFallsContainer: {
    backgroundColor: Color.white,
    padding: Spacing.lg_24,
    borderRadius: Border.lg_16,
    alignItems: 'center',
    ...shadowStyles.cardShadow,
  },
  noFallsText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs_4,
  },
  noFallsSubtext: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  moreItemsText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    textAlign: 'center',
    marginTop: Spacing.sm_8,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodylarge_18,
    color: Color.Error.default,
    textAlign: 'center',
  },
  moreItemsButton: {
    marginTop: Spacing.sm_8,
    backgroundColor: Color.white,             
    borderWidth: 1.5,                         
    borderColor: Color.Error.default,               
    borderRadius: Border.full,                
    paddingVertical: Spacing.sm_8,            
    paddingHorizontal: Spacing.md_16,         
    alignItems: 'center',                     
    justifyContent: 'center',                 
  },
  moreItemsButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Error.default,                    
  },
  filterContainer: {
    marginBottom: Spacing.md_16,
    flexGrow: 0, 
  },
  filterChip: {
    paddingVertical: Spacing.xs_6,
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
});

export default InstitutionDashboardScreen;
