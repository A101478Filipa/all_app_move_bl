import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
  Modal,
  Image,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { CalendarEvent, CalendarEventType, Elderly, UserRole } from 'moveplus-shared';
import { calendarEventApi } from '@src/api/endpoints/calendarEvents';
import { useAuthStore } from '@src/stores/authStore';
import { useInstitutionMembersStore } from '@src/stores';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { buildAvatarUrl } from '@src/services/ApiService';
import { InstitutionDashboardNavigationStackParamList } from '@src/navigation/InstitutionDashboardNavigationStack';

type InstitutionCalendarEvent = CalendarEvent & {
  elderly?: { id: number; name: string; medicalId: number };
};

type Props = NativeStackScreenProps<InstitutionDashboardNavigationStackParamList, 'BathSchedule'>;

const BATH_COLOR = '#0288D1';
const COL_WIDTH = 148;

// Paleta de cores por paciente (cicla automaticamente)
const PATIENT_PALETTE = [
  '#0288D1', 
  '#2E7D32', 
  '#6A1B9A', 
  '#E65100', 
  '#AD1457', 
  '#00695C',
  '#F9A825', 
  '#4527A0', 
  '#558B2F', 
  '#D84315',
];

const getPatientColor = (elderlyId: number): string =>
  PATIENT_PALETTE[elderlyId % PATIENT_PALETTE.length];

// ── Week helpers ───────────────────────────────────────────────────────────
const getWeekStart = (ref: Date): Date => {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Mon-first
  return d;
};

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatTime = (date: Date | string) =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Day abbreviations: Mon-first, two langs
const DAY_ABBR: Record<string, string[]> = {
  pt: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

const BathScheduleScreen: React.FC<Props> = ({ navigation }) => {
  const { t, currentLanguage } = useTranslation();
  const { handleError } = useErrorHandler();
  const { user } = useAuthStore();
  const userRole = user?.user?.role;
  const currentUserId = user?.user?.id;
  const isAdmin = userRole === UserRole.INSTITUTION_ADMIN;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [events, setEvents] = useState<InstitutionCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Elderly picker
  const [pickVisible, setPickVisible] = useState(false);
  const [pickTargetDate, setPickTargetDate] = useState<Date | null>(null);
  const [search, setSearch] = useState('');

  // Event detail modal
  const [detailEvent, setDetailEvent] = useState<InstitutionCalendarEvent | null>(null);
  const { users: memberUsers, fetchUsers } = useInstitutionMembersStore();

  const fetchEvents = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await calendarEventApi.getInstitutionEvents();
      setEvents((res.data ?? []).filter(e => e.type === CalendarEventType.BATH));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      fetchUsers();
    }, [fetchEvents, fetchUsers])
  );

  // Week navigation
  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));
  const goToday = () => setWeekStart(getWeekStart(new Date()));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDay = (day: Date) =>
    events
      .filter(e => isSameDay(new Date(e.startDate), day))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const lang = (currentLanguage ?? 'en').startsWith('pt') ? 'pt' : 'en';
  const dayAbbr = DAY_ABBR[lang] ?? DAY_ABBR.en;

  const weekLabel = (() => {
    const end = addDays(weekStart, 6);
    const startStr = weekStart.toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    });
    const endStr = end.toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    });
    return `${startStr} – ${endStr}`;
  })();

  const isThisWeek = isSameDay(weekStart, getWeekStart(new Date()));

  const scrollRef = useRef<ScrollView>(null);

  const getTargetOffset = useCallback(
    () => (isThisWeek ? ((today.getDay() - 1 + 7) % 7) * COL_WIDTH : 0),
    [isThisWeek]
  );

  // Scroll when week changes (ScrollView already mounted)
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: getTargetOffset(), animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, [weekStart]);

  const canEditEvent = (event: InstitutionCalendarEvent) => {
    if (isAdmin) return true;
    const isPast = new Date(event.startDate) < today;
    if (isPast) return false;
    return event.createdById === currentUserId;
  };

  const handleDeleteEvent = (event: InstitutionCalendarEvent) => {
    Alert.alert(
      t('calendar.deleteEvent'),
      t('calendar.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await calendarEventApi.deleteEvent(event.id);
              setEvents(prev => prev.filter(e => e.id !== event.id));
            } catch (err) {
              handleError(err);
            }
          },
        },
      ]
    );
  };

  const handleEventPress = (event: InstitutionCalendarEvent) => {
    setDetailEvent(event);
  };

  const handleAddOnDay = (day: Date) => {
    setPickTargetDate(day);
    setSearch('');
    setPickVisible(true);
  };

  const handleSelectElderly = (elderly: Elderly) => {
    setPickVisible(false);
    if (!pickTargetDate) return;
    navigation.push('AddCalendarEvent', {
      elderlyId: elderly.id,
      selectedDate: pickTargetDate.toISOString(),
      prefillType: CalendarEventType.BATH,
    });
  };

  const filteredElderly = memberUsers.elderly.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <ActivityIndicatorOverlay />;

  return (
    <View style={styles.container}>
      {/* Week Header */}
      <View style={styles.weekHeader}>
        <TouchableOpacity style={styles.navBtn} onPress={prevWeek}>
          <MaterialIcons name="chevron-left" size={22} color={Color.dark} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.weekLabelBtn} onPress={goToday}>
          <Text style={styles.weekLabel}>{weekLabel}</Text>
          {!isThisWeek && (
            <Text style={styles.todayChip}>{t('calendar.today')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtn} onPress={nextWeek}>
          <MaterialIcons name="chevron-right" size={22} color={Color.dark} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Day Columns */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.columnsContainer}
        onLayout={() => scrollRef.current?.scrollTo({ x: getTargetOffset(), animated: false })}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(true)} />
        }
        style={{ flex: 1 }}
      >
        {weekDays.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, today);
          const isPast = day < today;

          return (
            <View key={idx} style={[styles.dayColumn, isToday && styles.dayColumnToday]}>
              {/* Day Header */}
              <View style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>
                <Text style={[styles.dayAbbr, isToday && styles.dayAbbrToday]}>
                  {dayAbbr[idx]}
                </Text>
                <View style={[styles.dayNumCircle, isToday && styles.dayNumCircleToday]}>
                  <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                    {day.getDate()}
                  </Text>
                </View>
              </View>

              {/* Add button */}
              <TouchableOpacity
                style={styles.addDayBtn}
                onPress={() => handleAddOnDay(day)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="add" size={14} color={BATH_COLOR} />
                <Text style={styles.addDayBtnText}>{t('calendar.addEvent')}</Text>
              </TouchableOpacity>

              {/* Bath Cards */}
              <View style={styles.cardsList}>
                {dayEvents.length === 0 ? (
                  <View style={styles.emptyDay}>
                    <MaterialIcons name="shower" size={22} color={Color.Gray.v200} />
                  </View>
                ) : (
                  dayEvents.map(event => {
                    const resident = (event as any).elderly;
                    const editable = canEditEvent(event);
                    const cardColor = getPatientColor(event.elderlyId ?? 0);
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.bathCard,
                          { borderLeftColor: cardColor, backgroundColor: cardColor + '18' },
                          isPast && !isToday && styles.bathCardPast,
                        ]}
                        onPress={() => handleEventPress(event)}
                        activeOpacity={editable ? 0.75 : 1}
                      >
                        <View style={styles.bathCardTopRow}>
                          <MaterialIcons name="shower" size={13} color={cardColor} />
                          <Text style={[styles.bathCardTime, { color: cardColor }]}>
                            {event.allDay ? t('calendar.allDay') : formatTime(event.startDate)}
                          </Text>
                          {editable && (
                            <MaterialIcons
                              name="more-vert"
                              size={13}
                              color={Color.Gray.v300}
                              style={styles.moreIcon}
                            />
                          )}
                        </View>
                        <Text style={styles.bathCardResident} numberOfLines={2}>
                          {resident?.name ?? t('bath.unknownResident')}
                        </Text>
                        {(event as any).assignedTo?.name && (
                          <View style={styles.assignedRow}>
                            <MaterialIcons name="person-outline" size={11} color={Color.Gray.v400} />
                            <Text style={styles.assignedName} numberOfLines={1}>
                              {(event as any).assignedTo.name}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Event Detail Modal */}
      {detailEvent && (() => {
        const detailColor = getPatientColor(detailEvent.elderlyId ?? 0);
        const start = new Date(detailEvent.startDate);
        const end = detailEvent.endDate ? new Date(detailEvent.endDate) : null;
        const editable = canEditEvent(detailEvent);
        const dateStr = start.toLocaleDateString(
          lang === 'pt' ? 'pt-PT' : 'en-GB',
          { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
        );
        return (
          <Modal
            visible
            animationType="slide"
            transparent
            onRequestClose={() => setDetailEvent(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />

                {/* Header com cor do residente */}
                <View style={[styles.detailHeader, { borderLeftColor: detailColor }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle} numberOfLines={2}>
                      {detailEvent.title}
                    </Text>
                    <Text style={[styles.detailResidentName, { color: detailColor }]}>
                      {(detailEvent as any).elderly?.name ?? t('bath.unknownResident')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailEvent(null)}>
                    <MaterialIcons name="close" size={24} color={Color.Gray.v500} />
                  </TouchableOpacity>
                </View>

                {/* Linhas de info */}
                <View style={styles.detailRows}>
                  {/* Data */}
                  <View style={styles.detailRow}>
                    <MaterialIcons name="event" size={18} color={detailColor} />
                    <Text style={styles.detailRowText} numberOfLines={2}>{dateStr}</Text>
                  </View>

                  {/* Hora */}
                  <View style={styles.detailRow}>
                    <MaterialIcons name="schedule" size={18} color={detailColor} />
                    <Text style={styles.detailRowText}>
                      {detailEvent.allDay
                        ? t('calendar.allDay')
                        : end
                          ? `${formatTime(start)} – ${formatTime(end)}`
                          : formatTime(start)}
                    </Text>
                  </View>

                  {/* Cuidador atribuído */}
                  {(detailEvent as any).assignedTo?.name && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="person" size={18} color={detailColor} />
                      <Text style={styles.detailRowText}>
                        {(detailEvent as any).assignedTo.name}
                      </Text>
                    </View>
                  )}

                  {/* Notas / descrição */}
                  {detailEvent.description ? (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="notes" size={18} color={detailColor} />
                      <Text style={styles.detailRowText}>{detailEvent.description}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Ações (só se editável) */}
                {editable && (
                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={[styles.detailActionBtn, { borderColor: detailColor }]}
                      onPress={() => {
                        setDetailEvent(null);
                        navigation.push('AddCalendarEvent', {
                          elderlyId: detailEvent.elderlyId,
                          editEvent: detailEvent,
                        });
                      }}
                    >
                      <MaterialIcons name="edit" size={16} color={detailColor} />
                      <Text style={[styles.detailActionBtnText, { color: detailColor }]}>
                        {t('calendar.editEvent')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.detailActionBtn, styles.detailActionBtnDanger]}
                      onPress={() => {
                        setDetailEvent(null);
                        handleDeleteEvent(detailEvent);
                      }}
                    >
                      <MaterialIcons name="delete-outline" size={16} color="#C62828" />
                      <Text style={[styles.detailActionBtnText, { color: '#C62828' }]}>
                        {t('calendar.deleteEvent')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* Elderly Picker Modal */}
      <Modal
        visible={pickVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>{t('bath.selectResident')}</Text>
                {pickTargetDate && (
                  <Text style={styles.modalSubtitle}>
                    {pickTargetDate.toLocaleDateString(
                      lang === 'pt' ? 'pt-PT' : 'en-GB',
                      { weekday: 'long', day: 'numeric', month: 'long' }
                    )}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setPickVisible(false)}>
                <MaterialIcons name="close" size={24} color={Color.Gray.v500} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color={Color.Gray.v400} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('elderly.searchByNameOrEmail')}
                value={search}
                onChangeText={setSearch}
                placeholderTextColor={Color.Gray.v400}
              />
            </View>
            <FlatList
              data={filteredElderly}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Spacing.xl_32 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.elderlyRow}
                  onPress={() => handleSelectElderly(item)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: buildAvatarUrl(item.user.avatarUrl) }}
                    style={styles.avatar}
                  />
                  <Text style={styles.elderlyName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <MaterialIcons name="chevron-right" size={18} color={Color.Gray.v300} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyPickerText}>{t('bath.noResidentsFound')}</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BathScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  // ── Week header ─────────────────────────────────────────────────────────
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_12,
    backgroundColor: Color.Background.white,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v200,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: Border.sm_8,
    backgroundColor: Color.Background.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekLabelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs_4,
  },
  weekLabel: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  todayChip: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.medium,
    color: BATH_COLOR,
    backgroundColor: BATH_COLOR + '18',
    borderRadius: Border.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  // ── Columns ─────────────────────────────────────────────────────────────
  columnsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm_8,
    paddingTop: Spacing.sm_8,
    paddingBottom: Spacing.xl_32,
    gap: Spacing.sm_8,
  },
  dayColumn: {
    width: COL_WIDTH,
    borderRadius: Border.md_12,
    backgroundColor: Color.Background.white,
    overflow: 'hidden',
  },
  dayColumnToday: {
    borderWidth: 1.5,
    borderColor: BATH_COLOR,
  },
  // ── Day header inside column ─────────────────────────────────────────────
  dayHeader: {
    paddingVertical: Spacing.sm_12,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Color.Gray.v100,
  },
  dayHeaderToday: {
    backgroundColor: BATH_COLOR + '18',
  },
  dayAbbr: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayAbbrToday: {
    color: BATH_COLOR,
    fontFamily: FontFamily.bold,
  },
  dayNumCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumCircleToday: {
    backgroundColor: BATH_COLOR,
  },
  dayNum: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  dayNumToday: {
    color: Color.white,
  },
  // ── Add button inside column ─────────────────────────────────────────────
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: Spacing.xs_4,
    marginHorizontal: Spacing.sm_8,
    marginTop: Spacing.sm_8,
    borderRadius: Border.sm_8,
    borderWidth: 1,
    borderColor: BATH_COLOR + '60',
    borderStyle: 'dashed',
  },
  addDayBtnText: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.medium,
    color: BATH_COLOR,
  },
  // ── Cards list ───────────────────────────────────────────────────────────
  cardsList: {
    padding: Spacing.sm_8,
    gap: Spacing.sm_8,
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: Spacing.lg_24,
    opacity: 0.5,
  },
  bathCard: {
    backgroundColor: BATH_COLOR + '0E',
    borderRadius: Border.sm_8,
    borderLeftWidth: 3,
    borderLeftColor: BATH_COLOR,
    padding: Spacing.sm_8,
    gap: 3,
  },
  bathCardPast: {
    opacity: 0.55,
  },
  bathCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bathCardTime: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.semi_bold,
    color: BATH_COLOR,
    flex: 1,
  },
  moreIcon: {
    marginLeft: 'auto',
  },
  bathCardResident: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.medium,
    color: Color.dark,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  assignedName: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    flex: 1,
  },
  // ── Modal ────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Color.Background.white,
    borderTopLeftRadius: Border.lg_16,
    borderTopRightRadius: Border.lg_16,
    paddingHorizontal: Spacing.md_16,
    paddingBottom: Spacing.xl_32,
    maxHeight: '80%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Color.Gray.v200,
    marginTop: Spacing.sm_8,
    marginBottom: Spacing.md_16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md_16,
  },
  modalTitle: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  modalSubtitle: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_12,
    paddingVertical: Spacing.sm_8,
    gap: Spacing.xs_4,
    marginBottom: Spacing.md_16,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.dark,
    padding: 0,
  },
  elderlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm_12,
    gap: Spacing.sm_12,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v100,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Color.Gray.v100,
  },
  elderlyName: {
    flex: 1,
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.dark,
  },
  emptyPickerText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    textAlign: 'center',
    marginTop: Spacing.lg_24,
  },
  // ── Event detail modal ───────────────────────────────────────────────────
  detailHeader: {
    borderLeftWidth: 4,
    borderRadius: 2,
    paddingLeft: Spacing.sm_12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md_16,
    gap: Spacing.sm_8,
  },
  detailTitle: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  detailResidentName: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  detailRows: {
    gap: Spacing.sm_12,
    marginBottom: Spacing.lg_24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm_8,
  },
  detailRowText: {
    flex: 1,
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.dark,
    textTransform: 'capitalize',
  },
  detailActions: {
    flexDirection: 'row',
    gap: Spacing.sm_8,
  },
  detailActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs_4,
    paddingVertical: Spacing.sm_12,
    borderRadius: Border.sm_8,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  detailActionBtnDanger: {
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  detailActionBtnText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
  },
});
