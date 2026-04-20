import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { shadowStyles } from '@src/styles/shadow';
import { VStack, HStack } from '@components/CoreComponents';
import { useAuthStore, useElderlyDashboardStore } from '@src/stores';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ElderlyDashboardNavigationStackParamList } from '@navigation/ElderlyDashboardNavigationStack';
import { PendingDataAccessRequestsWidget } from '@components/PendingDataAccessRequestsWidget';
import Toast from 'react-native-toast-message';
import { CalendarEvent, CalendarEventType } from 'moveplus-shared';
import { calendarEventApi } from '@src/api/endpoints/calendarEvents';
import { EVENT_TYPE_CONFIG } from '@components/CalendarEventCard';
import { UpcomingBirthdaysWidget } from '@components/UpcomingBirthdaysWidget';


const SOS_COLOR = Color.Warning.amber;

// MARK: Types
type NavigationProp = NativeStackNavigationProp<ElderlyDashboardNavigationStackParamList>;
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

// MARK: Screen
const ElderlyDashboardScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    pendingAccessRequests,
    state: dashboardState,
    fetch,
    removeRequest,
    reportFall,
    isReportingFall,
    reportSos,
    isReportingSos,
  } = useElderlyDashboardStore();
  const navigation = useNavigation<NavigationProp>();

  // Fall button state
  const [showFallConfirmation, setShowFallConfirmation] = useState(false);
  const [fallCountdown, setFallCountdown] = useState(5);
  const fallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SOS button state
  const [showSosConfirmation, setShowSosConfirmation] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const sosTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Today's events
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!user?.id) return;
    calendarEventApi.getEvents(user.id).then(res => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const filtered = (res.data ?? []).filter(e => {
        const d = new Date(e.startDate as any);
        return d >= startOfToday && d < endOfToday;
      });
      filtered.sort((a, b) => new Date(a.startDate as any).getTime() - new Date(b.startDate as any).getTime());
      setTodayEvents(filtered);
    }).catch(err => console.warn('[Dashboard] Failed to load today events:', err));
  }, [user?.id]);

  // ── Fall report logic ──────────────────────────────────
  const submitFallReport = useCallback(async () => {
    if (!user?.id) return;
    try {
      await reportFall(user.id, t('elderly.reportedByUser'));
      Toast.show({
        type: 'success',
        text1: t('elderly.fallReported'),
        text2: t('elderly.fallReportedDescription'),
      });
      setShowFallConfirmation(false);
      setFallCountdown(5);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('elderly.failedToReportFall'),
      });
    }
  }, [user, t, reportFall]);

  useEffect(() => {
    if (showFallConfirmation && fallCountdown > 0) {
      fallTimerRef.current = setTimeout(() => setFallCountdown(fallCountdown - 1), 1000);
    } else if (showFallConfirmation && fallCountdown === 0) {
      submitFallReport();
    }
    return () => {
      if (fallTimerRef.current) clearTimeout(fallTimerRef.current);
    };
  }, [showFallConfirmation, fallCountdown, submitFallReport]);

  const handleReportFall = useCallback(() => {
    setShowFallConfirmation(true);
    setFallCountdown(5);
  }, []);

  const handleCancelFall = useCallback(() => {
    setShowFallConfirmation(false);
    setFallCountdown(5);
    if (fallTimerRef.current) clearTimeout(fallTimerRef.current);
  }, []);

  const handleConfirmFall = useCallback(() => {
    if (fallTimerRef.current) clearTimeout(fallTimerRef.current);
    submitFallReport();
  }, [submitFallReport]);

  // ── SOS report logic ───────────────────────────────────
  const submitSosReport = useCallback(async () => {
    if (!user?.id) return;
    try {
      await reportSos(user.id);
      Toast.show({
        type: 'success',
        text1: t('elderly.sosReported'),
        text2: t('elderly.sosReportedDescription'),
      });
      setShowSosConfirmation(false);
      setSosCountdown(5);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('elderly.failedToReportSos'),
      });
    }
  }, [user, t, reportSos]);

  useEffect(() => {
    if (showSosConfirmation && sosCountdown > 0) {
      sosTimerRef.current = setTimeout(() => setSosCountdown(sosCountdown - 1), 1000);
    } else if (showSosConfirmation && sosCountdown === 0) {
      submitSosReport();
    }
    return () => {
      if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
    };
  }, [showSosConfirmation, sosCountdown, submitSosReport]);

  const handleSendSos = useCallback(() => {
    setShowSosConfirmation(true);
    setSosCountdown(5);
  }, []);

  const handleCancelSos = useCallback(() => {
    setShowSosConfirmation(false);
    setSosCountdown(5);
    if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
  }, []);

  const handleConfirmSos = useCallback(() => {
    if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
    submitSosReport();
  }, [submitSosReport]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency Fall Report Button */}
        <View style={styles.emergencyButton}>
          <TouchableOpacity
            onPress={handleReportFall}
            disabled={isReportingFall}
            activeOpacity={0.8}
          >
            <VStack spacing={Spacing.sm_8} align="center">
              <Text style={styles.emergencyButtonText}>
                {t('elderly.iFell')}
              </Text>
              <Text style={styles.emergencyButtonSubtext}>
                {t('elderly.tapToReport')}
              </Text>
            </VStack>
          </TouchableOpacity>
        </View>

        {/* SOS Alert Button */}
        <View style={styles.sosButton}>
          <TouchableOpacity
            onPress={handleSendSos}
            disabled={isReportingSos}
            activeOpacity={0.8}
          >
            <VStack spacing={Spacing.sm_8} align="center">
              <Text style={styles.sosButtonText}>
                {t('elderly.iSentSos')}
              </Text>
              <Text style={styles.sosButtonSubtext}>
                {t('elderly.tapToSendSos')}
              </Text>
            </VStack>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        <View style={styles.todayCard}>
          <HStack style={styles.todayCardHeader}>
            <MaterialIcons name="today" size={18} color={Color.primary} />
            <Text style={styles.todayCardTitle}>{t('calendar.todaySchedule')}</Text>
          </HStack>

          {todayEvents.length === 0 ? (
            <Text style={styles.todayEmptyText}>{t('calendar.noEventsToday')}</Text>
          ) : (
            <VStack align="flex-start" spacing={Spacing.xs_6} style={{ alignSelf: 'stretch' }}>
              {todayEvents.map(event => {
                const config = EVENT_TYPE_CONFIG[event.type] ?? EVENT_TYPE_CONFIG[CalendarEventType.OTHER];
                const timeStr = event.allDay
                  ? t('calendar.allDay')
                  : new Date(event.startDate as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const typeLabel = t(`calendar.types.${event.type}`);
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.todayEventRow}
                    activeOpacity={0.7}
                    onPress={() => setSelectedEvent(event)}
                  >
                    <View style={[styles.todayEventBar, { backgroundColor: config.color }]} />
                    <View style={styles.todayEventContent}>
                      <Text style={[styles.todayEventType, { color: config.color }]}>{typeLabel}</Text>
                      <Text style={styles.todayEventTime}>{timeStr}</Text>
                      <Text style={styles.todayEventTitle} numberOfLines={1}>{event.title}</Text>
                      {(event.assignedTo || event.externalProfessionalName) && (
                        <Text style={styles.todayEventPerson} numberOfLines={1}>
                          {event.assignedTo ? event.assignedTo.name : event.externalProfessionalName}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.todayEventIcon, { backgroundColor: config.color + '18' }]}>
                      <MaterialIcons name={config.icon as any} size={16} color={config.color} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </VStack>
          )}
        </View>

        {/* Upcoming Birthdays */}
        <UpcomingBirthdaysWidget />

        {/* Pending Data Access Requests */}
        <PendingDataAccessRequestsWidget
          requests={pendingAccessRequests}
          state={dashboardState}
          onRequestResponded={removeRequest}
          userRole={user?.user?.role}
        />


      </ScrollView>

      {/* Event Detail Modal */}
      {selectedEvent && (() => {
        const ev = selectedEvent;
        const config = EVENT_TYPE_CONFIG[ev.type] ?? EVENT_TYPE_CONFIG[CalendarEventType.OTHER];
        const typeLabel = t(`calendar.types.${ev.type}`);
        const timeStr = ev.allDay
          ? t('calendar.allDay')
          : new Date(ev.startDate as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = ev.endDate
          ? new Date(ev.endDate as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null;
        const responsible = ev.assignedTo ? ev.assignedTo.name : ev.externalProfessionalName;
        return (
          <Modal
            visible
            transparent
            animationType="slide"
            onRequestClose={() => setSelectedEvent(null)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setSelectedEvent(null)}
            />
            <View style={styles.modalSheet}>
              {/* Drag handle */}
              <View style={styles.modalHandle} />

              {/* Header bar with type colour */}
              <View style={[styles.modalTypeBar, { backgroundColor: config.color }]}>
                <MaterialIcons name={config.icon as any} size={20} color={Color.white} />
                <Text style={styles.modalTypeLabel}>{typeLabel}</Text>
              </View>

              {/* Title */}
              <Text style={styles.modalTitle}>{ev.title}</Text>

              {/* Time row */}
              <HStack style={styles.modalInfoRow}>
                <MaterialIcons name="access-time" size={18} color={Color.Gray.v500} />
                <Text style={styles.modalInfoText}>
                  {timeStr}{endTimeStr ? ` — ${endTimeStr}` : ''}
                </Text>
              </HStack>

              {/* Location */}
              {!!ev.location && (
                <HStack style={styles.modalInfoRow}>
                  <MaterialIcons name="place" size={18} color={Color.Gray.v500} />
                  <Text style={styles.modalInfoText}>{ev.location}</Text>
                </HStack>
              )}

              {/* Responsible */}
              {!!responsible && (
                <HStack style={styles.modalInfoRow}>
                  <MaterialIcons
                    name={ev.assignedTo?.role === 'CLINICIAN' ? 'medical-services' : 'person-outline'}
                    size={18}
                    color={Color.Gray.v500}
                  />
                  <Text style={styles.modalInfoText}>{responsible}</Text>
                </HStack>
              )}

              {/* Description */}
              {!!ev.description && (
                <View style={styles.modalDescBox}>
                  <Text style={styles.modalDescText}>{ev.description}</Text>
                </View>
              )}

              {/* Close button */}
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedEvent(null)}>
                <Text style={styles.modalCloseBtnText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        );
      })()}

      {/* Full-screen Fall Confirmation Overlay */}
      <Modal
        visible={showFallConfirmation}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCancelFall}
      >
        <View style={styles.fullscreenOverlayFall}>
          <VStack spacing={Spacing.xl_32} align="center" style={styles.fullscreenContent}>
            <VStack spacing={Spacing.md_16} align="center">
              <Text style={styles.fullscreenConfirmationText}>
                {t('elderly.fallWillBeReported')}
              </Text>
              <Text style={styles.fullscreenCountdownText}>{fallCountdown}</Text>
            </VStack>
            <HStack spacing={Spacing.md_16} style={styles.fullscreenButtons}>
              <TouchableOpacity
                onPress={handleCancelFall}
                disabled={isReportingFall}
                style={styles.cancelButton}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmFall}
                disabled={isReportingFall}
                style={styles.confirmButton}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>
                  {t('common.confirm')}
                </Text>
              </TouchableOpacity>
            </HStack>
          </VStack>
        </View>
      </Modal>

      {/* Full-screen SOS Confirmation Overlay */}
      <Modal
        visible={showSosConfirmation}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCancelSos}
      >
        <View style={styles.fullscreenOverlaySos}>
          <VStack spacing={Spacing.xl_32} align="center" style={styles.fullscreenContent}>
            <VStack spacing={Spacing.md_16} align="center">
              <Text style={styles.fullscreenConfirmationText}>
                {t('elderly.sosWillBeSent')}
              </Text>
              <Text style={styles.fullscreenCountdownText}>{sosCountdown}</Text>
            </VStack>
            <HStack spacing={Spacing.md_16} style={styles.fullscreenButtons}>
              <TouchableOpacity
                onPress={handleCancelSos}
                disabled={isReportingSos}
                style={styles.sosCancelButton}
                activeOpacity={0.8}
              >
                <Text style={styles.sosCancelButtonText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmSos}
                disabled={isReportingSos}
                style={styles.sosConfirmButton}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>
                  {t('common.confirm')}
                </Text>
              </TouchableOpacity>
            </HStack>
          </VStack>
        </View>
      </Modal>
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
    padding: Spacing.md_16,
  },
  emergencyButton: {
    backgroundColor: Color.Error.default,
    padding: Spacing.lg_24,
    borderRadius: Border.lg_16,
    alignSelf: 'stretch',
    marginBottom: Spacing.md_16,
    ...shadowStyles.cardShadow,
    shadowColor: Color.Error.dark,
  },
  sosButton: {
    backgroundColor: SOS_COLOR,
    padding: Spacing.lg_24,
    borderRadius: Border.lg_16,
    alignSelf: 'stretch',
    marginBottom: Spacing.xl_32,
    ...shadowStyles.cardShadow,
    shadowColor: SOS_COLOR,
  },
  emergencyButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading3_24,
    color: Color.white,
    textAlign: 'center',
  },
  emergencyButtonSubtext: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  sosButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading3_24,
    color: Color.white,
    textAlign: 'center',
  },
  sosButtonSubtext: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  confirmationText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.white,
    textAlign: 'center',
  },
  countdownText: {
    fontFamily: FontFamily.bold,
    fontSize: 48,
    color: Color.white,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: Color.white,
    paddingHorizontal: Spacing.lg_24,
    paddingVertical: Spacing.md_16,
    borderRadius: Border.sm_8,
    flex: 1,
  },
  cancelButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Error.default,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: Color.Error.dark,
    paddingHorizontal: Spacing.lg_24,
    paddingVertical: Spacing.md_16,
    borderRadius: Border.sm_8,
    flex: 1,
  },
  confirmButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.white,
    textAlign: 'center',
  },
  sosCancelButton: {
    backgroundColor: Color.white,
    paddingHorizontal: Spacing.lg_24,
    paddingVertical: Spacing.md_16,
    borderRadius: Border.sm_8,
    flex: 1,
  },
  sosCancelButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: SOS_COLOR,
    textAlign: 'center',
  },
  sosConfirmButton: {
    backgroundColor: '#E65100',
    paddingHorizontal: Spacing.lg_24,
    paddingVertical: Spacing.md_16,
    borderRadius: Border.sm_8,
    flex: 1,
  },
  fullscreenOverlayFall: {
    flex: 1,
    backgroundColor: Color.Error.default,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg_24,
  },
  fullscreenOverlaySos: {
    flex: 1,
    backgroundColor: SOS_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg_24,
  },
  fullscreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  fullscreenButtons: {
    paddingHorizontal: 0,
    alignSelf: 'stretch',
  },
  fullscreenConfirmationText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.heading3_24,
    color: Color.white,
    textAlign: 'center',
  },
  fullscreenCountdownText: {
    fontFamily: FontFamily.bold,
    fontSize: 120,
    color: Color.white,
    textAlign: 'center',
    lineHeight: 130,
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
  todayCard: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.lg_16,
    padding: Spacing.md_16,
    alignSelf: 'stretch',
    marginBottom: Spacing.md_16,
    gap: Spacing.sm_12,
    ...shadowStyles.cardShadow,
  },
  todayCardHeader: {
    alignItems: 'center',
    gap: Spacing.xs_6,
  },
  todayCardTitle: {
    flex: 1,
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
  },
  todayEmptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
    textAlign: 'center',
    paddingVertical: Spacing.xs_6,
  },
  todayEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: Spacing.sm_10,
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.sm_8,
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.xs_6,
  },
  todayEventBar: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    minHeight: 32,
  },
  todayEventContent: {
    flex: 1,
    gap: 2,
  },
  todayEventTime: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v500,
  },
  todayEventTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
  },
  todayEventPerson: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v500,
  },
  todayEventIcon: {
    width: 32,
    height: 32,
    borderRadius: Border.sm_8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayEventType: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: Color.Background.white,
    borderTopLeftRadius: Border.xl_24,
    borderTopRightRadius: Border.xl_24,
    padding: Spacing.md_16,
    paddingBottom: Spacing.xl_32,
    gap: Spacing.sm_8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Color.Gray.v300,
    alignSelf: 'center',
    marginBottom: Spacing.sm_8,
  },
  modalTypeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs_6,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm_12,
    paddingVertical: Spacing.xs_6,
    borderRadius: Border.full,
    marginBottom: Spacing.xs_4,
  },
  modalTypeLabel: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
    color: Color.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading3_24,
    color: Color.dark,
  },
  modalInfoRow: {
    alignItems: 'center',
    gap: Spacing.xs_6,
  },
  modalInfoText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
    flex: 1,
  },
  modalDescBox: {
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.sm_8,
    padding: Spacing.sm_12,
    marginTop: Spacing.xs_4,
  },
  modalDescText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
  },
  modalCloseBtn: {
    marginTop: Spacing.sm_8,
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.sm_8,
    paddingVertical: Spacing.sm_12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
  },

});

export default ElderlyDashboardScreen;
