import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Animated, Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  CalendarEvent, CalendarEventType, UserRole,
  StaffWorkSchedule, StaffTimeOff, TimeOffType,
  getPortugueseHolidays,
} from 'moveplus-shared';
import { calendarEventApi } from '@src/api/endpoints/calendarEvents';
import { staffScheduleApi } from '@src/api/endpoints/staffSchedule';
import { timeOffApi, StaffTimeOffWithUser } from '@src/api/endpoints/timeOff';
import { elderlyAbsenceApi, ElderlyAbsenceWithElderly } from '@src/api/endpoints/elderlyAbsence';
import { EVENT_TYPE_CONFIG } from '@components/CalendarEventCard';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { useAuthStore } from '@src/stores/authStore';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { useErrorHandler } from '@src/hooks/useErrorHandler';

type ProfessionalCalendarEvent = CalendarEvent & {
  elderly?: { id: number; name: string; medicalId: number };
};

// These are the same params that both the caregiver/institution-admin and clinician navigators use
type Props = NativeStackScreenProps<any, 'ProfessionalCalendar'>;

// ── Constants ─────────────────────────────────────────────────────────────────
const HOUR_HEIGHT = 64;
const TIME_COL_WIDTH = 52;
const MIN_EVENT_HEIGHT = 28;
const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DOW_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTH_CELL_W = Math.floor(Dimensions.get('window').width / 7);

// ── Helpers ───────────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Returns 0=Mon … 6=Sun for the first day of the month
function getFirstDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function padTwo(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatHour(h: number): string {
  return `${padTwo(h)}:00`;
}

function formatEventTime(start: Date, end: Date): string {
  return `${padTwo(start.getHours())}:${padTwo(start.getMinutes())} – ${padTwo(end.getHours())}:${padTwo(end.getMinutes())}`;
}

function formatModalDate(d: Date): string {
  try {
    const s = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch {
    return d.toDateString();
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────
const ProfessionalCalendarScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userId, isAdmin } = route.params ?? {};
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();
  const { user } = useAuthStore();
  const userRole = user?.user?.role;

  const canEditEvent = useCallback((ev: ProfessionalCalendarEvent): boolean => {
    if (!userRole) return false;
    if (userRole === UserRole.ELDERLY) return false;
    if (userRole === UserRole.INSTITUTION_ADMIN || userRole === UserRole.PROGRAMMER) return true;
    return new Date(ev.startDate) >= new Date();
  }, [userRole]);

  const todayMemo = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(todayMemo));
  const [events, setEvents] = useState<ProfessionalCalendarEvent[]>([]);
  const [workSchedule, setWorkSchedule] = useState<StaffWorkSchedule | null>(null);
  const [timeOffs, setTimeOffs] = useState<StaffTimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedModal, setSelectedModal] = useState<ProfessionalCalendarEvent | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(500)).current;

  // Admin-only institution-wide data
  const [adminTimeOffs, setAdminTimeOffs] = useState<StaffTimeOffWithUser[]>([]);
  const [adminAbsences, setAdminAbsences] = useState<ElderlyAbsenceWithElderly[]>([]);
  const [filterHolidays, setFilterHolidays] = useState(true);
  const [filterStaffVacations, setFilterStaffVacations] = useState(true);
  const [filterElderlyAbsences, setFilterElderlyAbsences] = useState(true);
  // Role-based event filters (admin only) — true = show that role's events
  const [filterCaregivers, setFilterCaregivers] = useState(true);
  const [filterClinicians, setFilterClinicians] = useState(true);

  const openModal = (ev: ProfessionalCalendarEvent) => {
    slideAnim.setValue(500);
    setSelectedModal(ev);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, { toValue: 500, duration: 220, useNativeDriver: true }).start(
      () => setSelectedModal(null)
    );
  };

  // Tick current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const isViewingToday = isSameDay(selectedDate, todayMemo);

  // Auto-scroll to current time when viewing today in week mode
  useEffect(() => {
    if (viewMode === 'week' && isViewingToday) {
      const totalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      const y = Math.max(0, (totalMinutes / 60) * HOUR_HEIGHT - 150);
      const timer = setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 400);
      return () => clearTimeout(timer);
    }
  }, [isViewingToday, viewMode]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const [evRes] = await Promise.all([
        isAdmin
          ? calendarEventApi.getInstitutionEvents()
          : calendarEventApi.getProfessionalEvents(userId),
      ]);
      setEvents(evRes.data);

      // Fetch schedule data only when viewing a specific professional (not institution-wide admin view)
      if (!isAdmin && userId) {
        const [schedRes, timeOffRes] = await Promise.all([
          staffScheduleApi.getSchedule(userId).catch(() => ({ data: null })),
          timeOffApi.getTimeOffs(userId).catch(() => ({ data: [] })),
        ]);
        setWorkSchedule(schedRes.data);
        setTimeOffs(timeOffRes.data ?? []);
      }

      // Fetch institution-wide time-offs and absences for admin
      if (isAdmin) {
        const [instTimeOffRes, instAbsencesRes] = await Promise.all([
          timeOffApi.getInstitutionTimeOffs().catch(() => ({ data: [] })),
          elderlyAbsenceApi.getInstitutionAbsences().catch(() => ({ data: [] })),
        ]);
        setAdminTimeOffs(instTimeOffRes.data ?? []);
        setAdminAbsences(instAbsencesRes.data ?? []);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin]);
  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  // ── Week view derived ─────────────────────────────────────────────────────
  const weekStart = useMemo(() => getMondayOfWeek(selectedDate), [selectedDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart]
  );

  const monthHeader = useMemo(() => {
    const s = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [selectedDate]);

  // Events filtered by role (admin only) – used everywhere instead of raw `events`
  const displayedEvents = useMemo(() => {
    if (!isAdmin || (filterCaregivers && filterClinicians)) return events;
    return events.filter(e => {
      const role = (e as any).assignedTo?.role;
      if (role === 'CAREGIVER' && !filterCaregivers) return false;
      if (role === 'CLINICIAN' && !filterClinicians) return false;
      return true;
    });
  }, [events, isAdmin, filterCaregivers, filterClinicians]);

  const selectedDayEvents = useMemo(
    () =>
      displayedEvents
        .filter(e => isSameDay(new Date(e.startDate), selectedDate))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [displayedEvents, selectedDate]
  );

  const dayDotMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const e of displayedEvents) {
      const d = new Date(e.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const color = (EVENT_TYPE_CONFIG[e.type] ?? EVENT_TYPE_CONFIG[CalendarEventType.OTHER]).color;
      const prev = map.get(key) ?? [];
      if (!prev.includes(color) && prev.length < 3) map.set(key, [...prev, color]);
    }
    return map;
  }, [displayedEvents]);

  // ── Month view derived ────────────────────────────────────────────────────
  const mvYear = selectedDate.getFullYear();
  const mvMonth = selectedDate.getMonth();

  const monthDotMap = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const e of displayedEvents) {
      const d = new Date(e.startDate);
      if (d.getFullYear() !== mvYear || d.getMonth() !== mvMonth) continue;
      const day = d.getDate();
      const color = (EVENT_TYPE_CONFIG[e.type] ?? EVENT_TYPE_CONFIG[CalendarEventType.OTHER]).color;
      const prev = map.get(day) ?? [];
      if (!prev.includes(color) && prev.length < 3) map.set(day, [...prev, color]);
    }
    return map;
  }, [displayedEvents, mvYear, mvMonth]);

  const monthCellRows = useMemo(() => {
    const daysInMonth = getDaysInMonth(mvYear, mvMonth);
    const firstDow = getFirstDayOfWeek(mvYear, mvMonth);
    const flat: (number | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (flat.length % 7 !== 0) flat.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < flat.length; i += 7) rows.push(flat.slice(i, i + 7));
    return rows;
  }, [mvYear, mvMonth]);

  // ── Schedule overlays ─────────────────────────────────────────────────────
  /** ISO weekday of a Date: Mon=1 … Sun=7 */
  const isoWeekday = (d: Date) => {
    const n = d.getDay();
    return n === 0 ? 7 : n;
  };

  const isWorkDay = useCallback((d: Date): boolean => {
    if (!workSchedule || workSchedule.workDays.length === 0) return true; // assume all days if no schedule
    return workSchedule.workDays.includes(isoWeekday(d));
  }, [workSchedule]);

  const getTimeOffForDay = useCallback((d: Date): StaffTimeOff | undefined => {
    return timeOffs.find(t => {
      const start = new Date(t.startDate); start.setHours(0, 0, 0, 0);
      const end = new Date(t.endDate); end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });
  }, [timeOffs]);

  const ptHolidaysThisYear = useMemo(() => getPortugueseHolidays(selectedDate.getFullYear()), [selectedDate]);

  const getHolidayForDay = useCallback((d: Date): string | undefined => {
    const h = ptHolidaysThisYear.find(
      h => h.date.getFullYear() === d.getFullYear() &&
           h.date.getMonth() === d.getMonth() &&
           h.date.getDate() === d.getDate(),
    );
    return h?.name;
  }, [ptHolidaysThisYear]);

  /** Returns colour overlay info for a calendar day cell */
  const getDayOverlay = useCallback((d: Date): { color: string; label?: string } | null => {
    if (isAdmin) return null; // no overlays in institution-wide admin view
    const holiday = getHolidayForDay(d);
    if (holiday) return { color: '#FF4C4C20', label: holiday };
    const timeOff = getTimeOffForDay(d);
    if (timeOff) {
      if (timeOff.type === TimeOffType.VACATION) return { color: '#22C55E20', label: 'Férias' };
      if (timeOff.type === TimeOffType.DAY_OFF)   return { color: '#F97316' + '20', label: 'Folga' };
      if (timeOff.type === TimeOffType.SICK_LEAVE) return { color: '#A855F7' + '20', label: 'Baixa' };
    }
    if (!isWorkDay(d)) return { color: Color.Gray.v200 + '55' };
    return null;
  }, [isAdmin, getHolidayForDay, getTimeOffForDay, isWorkDay]);

  /** For admin view: category dots to show on each day (filtered by toggles) */
  const getAdminDayDots = useCallback((d: Date): { color: string; key: string }[] => {
    if (!isAdmin) return [];
    const dots: { color: string; key: string }[] = [];

    if (filterHolidays) {
      const holiday = getHolidayForDay(d);
      if (holiday) dots.push({ color: '#FF4C4C', key: 'holiday' });
    }

    if (filterStaffVacations) {
      const hits = adminTimeOffs.filter(t => {
        const start = new Date(t.startDate); start.setHours(0, 0, 0, 0);
        const end = new Date(t.endDate); end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      });
      if (hits.length > 0) {
        const colors = hits.slice(0, 3).map(t => {
          if (t.type === TimeOffType.VACATION) return '#22C55E';
          if (t.type === TimeOffType.SICK_LEAVE) return '#A855F7';
          return '#F97316';
        });
        colors.forEach((c, i) => dots.push({ color: c, key: `timeoff-${i}` }));
      }
    }

    if (filterElderlyAbsences) {
      const hasAbsence = adminAbsences.some(a => {
        const start = new Date(a.startDate); start.setHours(0, 0, 0, 0);
        const end = new Date(a.endDate); end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      });
      if (hasAbsence) dots.push({ color: Color.Gray.v400, key: 'absence' });
    }

    return dots.slice(0, 5);
  }, [isAdmin, filterHolidays, filterStaffVacations, filterElderlyAbsences, getHolidayForDay, adminTimeOffs, adminAbsences]);

  /** For admin view: get time-offs and absences for a specific day (for banner in week view) */
  const getAdminDayInfo = useCallback((d: Date): { timeOffs: StaffTimeOffWithUser[]; absences: ElderlyAbsenceWithElderly[]; holiday?: string } | null => {
    if (!isAdmin) return null;
    const holiday = filterHolidays ? getHolidayForDay(d) : undefined;
    const dayTimeOffs = filterStaffVacations ? adminTimeOffs.filter(t => {
      const start = new Date(t.startDate); start.setHours(0, 0, 0, 0);
      const end = new Date(t.endDate); end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }) : [];
    const dayAbsences = filterElderlyAbsences ? adminAbsences.filter(a => {
      const start = new Date(a.startDate); start.setHours(0, 0, 0, 0);
      const end = new Date(a.endDate); end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }) : [];
    if (!holiday && dayTimeOffs.length === 0 && dayAbsences.length === 0) return null;
    return { timeOffs: dayTimeOffs, absences: dayAbsences, holiday };
  }, [isAdmin, filterHolidays, filterStaffVacations, filterElderlyAbsences, getHolidayForDay, adminTimeOffs, adminAbsences]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigateWeek = (delta: number) =>
    setSelectedDate(d => {
      const nd = new Date(d);
      nd.setDate(d.getDate() + delta * 7);
      return nd;
    });

  const navigateMonth = (delta: number) =>
    setSelectedDate(d => {
      const nd = new Date(d);
      nd.setDate(1);
      nd.setMonth(d.getMonth() + delta);
      return nd;
    });

  const navigate = (delta: number) => viewMode === 'week' ? navigateWeek(delta) : navigateMonth(delta);

  const goToToday = () => setSelectedDate(new Date(todayMemo));

  const handleEditEvent = (ev: ProfessionalCalendarEvent) => {
    closeModal();
    setTimeout(() => navigation.push('AddCalendarEvent', { elderlyId: ev.elderlyId, editEvent: ev }), 250);
  };

  const handleAddEvent = useCallback(() => {
    const dateStr = selectedDate.toISOString();
    navigation.push('SelectElderlyScreen', { calendarMode: true, selectedDate: dateStr } as any);
  }, [navigation, selectedDate]);

  const currentTimeY = (currentTime.getHours() + currentTime.getMinutes() / 60) * HOUR_HEIGHT;

  if (loading) return <ActivityIndicatorOverlay />;

  // ── Event detail modal ────────────────────────────────────────────────────
  const renderModal = () => {
    if (!selectedModal) return null;
    const ev = selectedModal;
    const start = new Date(ev.startDate);
    const end = ev.endDate ? new Date(ev.endDate) : null;
    const config = EVENT_TYPE_CONFIG[ev.type] ?? EVENT_TYPE_CONFIG[CalendarEventType.OTHER];
    const typeName = (t as any)(`calendar.types.${ev.type}`) ?? ev.type;
    const canEdit = canEditEvent(ev);

    return (
      <Modal transparent animationType="none" visible onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeModal} />
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHandle} />

          {/* Title row */}
          <View style={styles.modalHeader}>
            <View style={[styles.modalTypeIcon, { backgroundColor: config.color + '25' }]}>
              <MaterialIcons name={config.icon} size={22} color={config.color} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm_10 }}>
              <Text style={styles.modalTitle} numberOfLines={2}>{ev.title}</Text>
              <Text style={[styles.modalTypeBadge, { color: config.color }]}>{typeName}</Text>
            </View>
            <TouchableOpacity onPress={closeModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={22} color={Color.Gray.v500} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          {/* Details */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
            {/* Date & time */}
            <View style={styles.modalRow}>
              <MaterialIcons name="access-time" size={18} color={Color.Gray.v500} style={styles.modalRowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalRowText}>{formatModalDate(start)}</Text>
                {ev.allDay ? (
                  <Text style={styles.modalRowSub}>Dia inteiro</Text>
                ) : end ? (
                  <Text style={styles.modalRowSub}>{formatEventTime(start, end)}</Text>
                ) : (
                  <Text style={styles.modalRowSub}>{padTwo(start.getHours())}:{padTwo(start.getMinutes())}</Text>
                )}
              </View>
            </View>

            {/* Patient */}
            {!!ev.elderly && (
              <View style={styles.modalRow}>
                <MaterialIcons name="person" size={18} color={Color.Gray.v500} style={styles.modalRowIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalRowLabel}>Utente</Text>
                  <Text style={styles.modalRowText}>{ev.elderly.name}</Text>
                </View>
              </View>
            )}

            {/* Location */}
            {!!ev.location && (
              <View style={styles.modalRow}>
                <MaterialIcons name="location-on" size={18} color={Color.Gray.v500} style={styles.modalRowIcon} />
                <Text style={[styles.modalRowText, { flex: 1 }]}>{ev.location}</Text>
              </View>
            )}

            {/* Description */}
            {!!ev.description && (
              <View style={styles.modalRow}>
                <MaterialIcons name="notes" size={18} color={Color.Gray.v500} style={styles.modalRowIcon} />
                <Text style={[styles.modalRowText, { flex: 1 }]}>{ev.description}</Text>
              </View>
            )}

            {/* Assigned to */}
            {!!ev.assignedTo && (
              <View style={styles.modalRow}>
                <MaterialIcons name="assignment-ind" size={18} color={Color.Gray.v500} style={styles.modalRowIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalRowLabel}>{t('calendar.assignedTo')}</Text>
                  <Text style={styles.modalRowText}>{ev.assignedTo.name}</Text>
                </View>
              </View>
            )}

            {/* External professional */}
            {!!ev.externalProfessionalName && (
              <View style={styles.modalRow}>
                <MaterialIcons name="person-outline" size={18} color={Color.Gray.v500} style={styles.modalRowIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalRowLabel}>{t('calendar.externalProfessional')}</Text>
                  <Text style={styles.modalRowText}>{ev.externalProfessionalName}</Text>
                </View>
              </View>
            )}

            {/* Created by */}
            {!!ev.createdBy && (
              <View style={styles.modalRow}>
                <MaterialIcons name="edit" size={18} color={Color.Gray.v500} style={styles.modalRowIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalRowLabel}>{t('calendar.by')}</Text>
                  <Text style={styles.modalRowText}>{ev.createdBy.name}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Edit button */}
          {canEdit && (
            <>
              <View style={styles.modalDivider} />
              <TouchableOpacity style={styles.editBtn} onPress={() => handleEditEvent(ev)} activeOpacity={0.85}>
                <MaterialIcons name="edit" size={18} color="#FFFFFF" />
                <Text style={styles.editBtnText}>{t('calendar.editEvent')}</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </Modal>
    );
  };

  // ── Month view ────────────────────────────────────────────────────────────
  const renderMonthView = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xl2_40 }}>
      {/* Day-of-week header */}
      <View style={styles.dovRow}>
        {DOW_LABELS.map(d => (
          <Text key={d} style={styles.dovLabel}>{d}</Text>
        ))}
      </View>

      {/* Month grid rows */}
      {monthCellRows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.mvGridRow}>
          {row.map((day, colIdx) => {
            if (day === null) {
              return <View key={`e-${rowIdx}-${colIdx}`} style={styles.mvCell} />;
            }
            const cellDate = new Date(mvYear, mvMonth, day);
            const selected = isSameDay(cellDate, selectedDate);
            const isToday = isSameDay(cellDate, todayMemo);
            const dots = monthDotMap.get(day) ?? [];
            const overlay = getDayOverlay(cellDate);
            const adminDots = getAdminDayDots(cellDate);
            return (
              <TouchableOpacity
                key={`${mvYear}-${mvMonth}-${day}`}
                style={[styles.mvCell, overlay && { backgroundColor: overlay.color }]}
                onPress={() => setSelectedDate(cellDate)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.mvDayCircle,
                  selected && styles.mvDayCircleSelected,
                  isToday && !selected && styles.mvDayCircleToday,
                ]}>
                  <Text style={[
                    styles.mvDayNum,
                    selected && styles.mvDayNumSelected,
                    isToday && !selected && styles.mvDayNumToday,
                  ]}>
                    {day}
                  </Text>
                </View>
                {overlay?.label ? (
                  <Text style={styles.overlayLabel} numberOfLines={1}>{overlay.label}</Text>
                ) : (
                  <View style={styles.dotRow}>
                    {dots.map((c, i) => (
                      <View key={i} style={[styles.dot, { backgroundColor: selected ? '#fff' : c }]} />
                    ))}
                    {adminDots.map((d, i) => (
                      <View key={`a${i}`} style={[styles.dot, { backgroundColor: selected ? '#fff' : d.color }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Selected day events list */}
      <View style={[styles.divider, { marginVertical: Spacing.sm_8 }]} />
      <View style={styles.dayLabelRow}>
        <Text style={styles.dayLabel} numberOfLines={1}>
          {(() => {
            const s = selectedDate.toLocaleString('default', { weekday: 'long', day: 'numeric', month: 'long' });
            return s.charAt(0).toUpperCase() + s.slice(1);
          })()}
        </Text>
        {selectedDayEvents.length > 0 && (
          <View style={styles.eventCountBadge}>
            <Text style={styles.eventCountText}>{selectedDayEvents.length}</Text>
          </View>
        )}
      </View>

      {selectedDayEvents.length === 0 ? (
        <Text style={styles.noEventsMonthHint}>{t('calendar.noEvents')}</Text>
      ) : (
        selectedDayEvents.map(ev => {
          const start = new Date(ev.startDate);
          const end = ev.endDate ? new Date(ev.endDate) : null;
          const config = EVENT_TYPE_CONFIG[ev.type] ?? EVENT_TYPE_CONFIG[CalendarEventType.OTHER];
          return (
            <TouchableOpacity
              key={ev.id}
              style={[styles.mvEventRow, { borderLeftColor: config.color }]}
              onPress={() => openModal(ev)}
              activeOpacity={0.75}
            >
              <View style={[styles.mvEventDot, { backgroundColor: config.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mvEventTitle} numberOfLines={1}>{ev.title}</Text>
                {ev.elderly && (
                  <Text style={styles.mvEventSub} numberOfLines={1}>{ev.elderly.name}</Text>
                )}
              </View>
              <Text style={[styles.mvEventTime, { color: config.color }]}>
                {ev.allDay
                  ? 'Dia inteiro'
                  : `${padTwo(start.getHours())}:${padTwo(start.getMinutes())}${end ? ` – ${padTwo(end.getHours())}:${padTwo(end.getMinutes())}` : ''}`
                }
              </Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );

  // ── Week view ─────────────────────────────────────────────────────────────
  const renderWeekView = () => (
    <>
      {/* 7-day strip */}
      <View style={styles.weekStrip}>
        {weekDays.map(day => {
          const selected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, todayMemo);
          const dotKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const dots = dayDotMap.get(dotKey) ?? [];
          const overlay = getDayOverlay(day);
          const adminDots = getAdminDayDots(day);
          return (
            <TouchableOpacity
              key={dotKey}
              style={[styles.dayCell, overlay && { backgroundColor: overlay.color }]}
              onPress={() => setSelectedDate(new Date(day))}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayLetter, isToday && !selected && styles.dayLetterToday]}>
                {DAY_SHORT[day.getDay()]}
              </Text>
              <View style={[
                styles.dayNumCircle,
                selected && styles.dayNumCircleSelected,
                isToday && !selected && styles.dayNumCircleToday,
              ]}>
                <Text style={[
                  styles.dayNum,
                  selected && styles.dayNumSelected,
                  isToday && !selected && styles.dayNumToday,
                ]}>
                  {day.getDate()}
                </Text>
              </View>
              {overlay?.label ? (
                <Text style={styles.overlayLabel} numberOfLines={1}>{overlay.label}</Text>
              ) : (
                <View style={styles.dotRow}>
                  {dots.map((c, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: selected ? '#fff' : c }]} />
                  ))}
                  {adminDots.map((d, i) => (
                    <View key={`a${i}`} style={[styles.dot, { backgroundColor: selected ? '#fff' : d.color }]} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day label row */}
      <View style={styles.dayLabelRow}>
        <Text style={styles.dayLabel} numberOfLines={1}>
          {(() => {
            const s = selectedDate.toLocaleString('default', { weekday: 'long', day: 'numeric', month: 'long' });
            return s.charAt(0).toUpperCase() + s.slice(1);
          })()}
        </Text>
        {selectedDayEvents.length > 0 && (
          <View style={styles.eventCountBadge}>
            <Text style={styles.eventCountText}>{selectedDayEvents.length}</Text>
          </View>
        )}
        {selectedDayEvents.length === 0 && (
          <Text style={styles.noEventsHint}>{t('calendar.noEvents')}</Text>
        )}
      </View>

      {/* Day-off / holiday / non-work banner */}
      {(() => {
        if (isAdmin) return null;
        const holiday = getHolidayForDay(selectedDate);
        if (holiday) return (
          <View style={[styles.dayBanner, { backgroundColor: '#FF4C4C18', borderColor: '#FF4C4C' }]}>
            <MaterialIcons name="event-busy" size={15} color="#FF4C4C" />
            <Text style={[styles.dayBannerText, { color: '#FF4C4C' }]}>Feriado: {holiday}</Text>
          </View>
        );
        const timeOff = getTimeOffForDay(selectedDate);
        if (timeOff) {
          const bannerColor = timeOff.type === TimeOffType.VACATION ? '#22C55E'
            : timeOff.type === TimeOffType.SICK_LEAVE ? '#A855F7' : '#F97316';
          const bannerLabel = timeOff.type === TimeOffType.VACATION ? 'Férias'
            : timeOff.type === TimeOffType.SICK_LEAVE ? 'Baixa médica' : 'Dia de folga';
          return (
            <View style={[styles.dayBanner, { backgroundColor: bannerColor + '18', borderColor: bannerColor }]}>
              <MaterialIcons name="beach-access" size={15} color={bannerColor} />
              <Text style={[styles.dayBannerText, { color: bannerColor }]}>{bannerLabel}{timeOff.note ? ` — ${timeOff.note}` : ''}</Text>
            </View>
          );
        }
        if (!isWorkDay(selectedDate)) return (
          <View style={[styles.dayBanner, { backgroundColor: Color.Gray.v200 + '55', borderColor: Color.Gray.v300 }]}>
            <MaterialIcons name="do-not-disturb" size={15} color={Color.Gray.v400} />
            <Text style={[styles.dayBannerText, { color: Color.Gray.v400 }]}>Dia não trabalhado</Text>
          </View>
        );
        return null;
      })()}

      {/* Admin overlays: time-offs and elderly absences for selected day */}
      {(() => {
        const adminInfo = getAdminDayInfo(selectedDate);
        if (!adminInfo) return null;
        return (
          <>
            {adminInfo.holiday && (
              <View style={[styles.dayBanner, { backgroundColor: '#FF4C4C18', borderColor: '#FF4C4C' }]}>
                <MaterialIcons name="event-busy" size={15} color="#FF4C4C" />
                <Text style={[styles.dayBannerText, { color: '#FF4C4C' }]}>Feriado: {adminInfo.holiday}</Text>
              </View>
            )}
            {adminInfo.timeOffs.length > 0 && (
              <View style={[styles.dayBanner, { backgroundColor: '#22C55E18', borderColor: '#22C55E' }]}>
                <MaterialIcons name="beach-access" size={15} color="#22C55E" />
                <Text style={[styles.dayBannerText, { color: '#22C55E' }]} numberOfLines={1}>
                  {adminInfo.timeOffs.map(t => {
                    const label = t.type === TimeOffType.VACATION ? 'Férias'
                      : t.type === TimeOffType.SICK_LEAVE ? 'Baixa' : 'Folga';
                    return `${t.user.name} (${label})`;
                  }).join(', ')}
                </Text>
              </View>
            )}
            {adminInfo.absences.length > 0 && (
              <View style={[styles.dayBanner, { backgroundColor: Color.Gray.v200 + '55', borderColor: Color.Gray.v300 }]}>
                <MaterialIcons name="person-off" size={15} color={Color.Gray.v500} />
                <Text style={[styles.dayBannerText, { color: Color.Gray.v500 }]} numberOfLines={1}>
                  Fora: {adminInfo.absences.map(a => a.elderly.name).join(', ')}
                </Text>
              </View>
            )}
          </>
        );
      })()}

      <View style={styles.divider} />

      {/* 24h scrollable day view */}
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dayGrid}>
          {/* Work-hours background band */}
          {!isAdmin && workSchedule && isWorkDay(selectedDate) && (() => {
            const [sh, sm] = workSchedule.startTime.split(':').map(Number);
            const [eh, em] = workSchedule.endTime.split(':').map(Number);
            const topY = (sh + sm / 60) * HOUR_HEIGHT;
            const height = ((eh + em / 60) - (sh + sm / 60)) * HOUR_HEIGHT;
            return (
              <View pointerEvents="none" style={[styles.workHoursBand, { top: topY, height }]} />
            );
          })()}

          {Array.from({ length: 24 }, (_, h) => (
            <View key={h} style={styles.hourRow}>
              <Text style={styles.timeLabel}>{h > 0 ? formatHour(h) : ''}</Text>
              <View style={[styles.hourLine, h === 0 && styles.hourLineHidden]} />
            </View>
          ))}

          {isViewingToday && (
            <View pointerEvents="none" style={[styles.currentTimeRow, { top: currentTimeY }]}>
              <View style={styles.currentTimeDot} />
              <View style={styles.currentTimeBar} />
            </View>
          )}

          {selectedDayEvents.map(ev => {
            const start = new Date(ev.startDate);
            const end = ev.endDate
              ? new Date(ev.endDate)
              : new Date(start.getTime() + 60 * 60 * 1000);
            const topY = (start.getHours() + start.getMinutes() / 60) * HOUR_HEIGHT;
            const durationH = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            const height = Math.max(durationH * HOUR_HEIGHT, MIN_EVENT_HEIGHT);
            const config = EVENT_TYPE_CONFIG[ev.type] ?? EVENT_TYPE_CONFIG[CalendarEventType.OTHER];
            return (
              <TouchableOpacity
                key={ev.id}
                activeOpacity={0.75}
                onPress={() => openModal(ev)}
                style={[
                  styles.eventBlock,
                  {
                    top: topY,
                    height,
                    backgroundColor: config.color + '22',
                    borderLeftColor: config.color,
                  },
                ]}
              >
                <Text style={[styles.eventTitle, { color: config.color }]} numberOfLines={height < 40 ? 1 : 2}>
                  {ev.title}
                </Text>
                {height >= 40 && ev.elderly && (
                  <Text style={[styles.eventPatient, { color: config.color }]} numberOfLines={1}>
                    {ev.elderly.name}
                  </Text>
                )}
                {height >= 52 && (
                  <Text style={[styles.eventTime, { color: config.color + 'bb' }]}>
                    {formatEventTime(start, end)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </>
  );

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header: month/year label + navigation + view toggle */}
      <View style={styles.header}>
        <View style={styles.monthRow}>
          <TouchableOpacity
            onPress={() => navigate(-1)}
            style={styles.navBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="chevron-left" size={26} color={Color.dark} />
          </TouchableOpacity>
          <Text style={styles.monthTitle} numberOfLines={1}>{monthHeader}</Text>
          <TouchableOpacity onPress={goToToday} style={styles.todayBtn}>
            <Text style={styles.todayBtnText}>Hoje</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode(v => (v === 'week' ? 'month' : 'week'))}
            style={[styles.viewToggleBtn, viewMode === 'month' && styles.viewToggleBtnActive]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialIcons
              name={viewMode === 'week' ? 'calendar-view-month' : 'view-week'}
              size={20}
              color={viewMode === 'month' ? Color.primary : Color.Gray.v500}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigate(1)}
            style={styles.navBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="chevron-right" size={26} color={Color.dark} />
          </TouchableOpacity>
        </View>

        {/* Admin filter chips */}
        {isAdmin && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
          >
            <TouchableOpacity
              style={[styles.filterChip, filterHolidays && styles.filterChipActive]}
              onPress={() => setFilterHolidays(v => !v)}
            >
              <View style={[styles.filterDot, { backgroundColor: '#FF4C4C' }]} />
              <Text style={[styles.filterChipText, filterHolidays && styles.filterChipTextActive]}>Feriados</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterStaffVacations && styles.filterChipActive]}
              onPress={() => setFilterStaffVacations(v => !v)}
            >
              <View style={[styles.filterDot, { backgroundColor: '#22C55E' }]} />
              <Text style={[styles.filterChipText, filterStaffVacations && styles.filterChipTextActive]}>Férias Pessoal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterElderlyAbsences && styles.filterChipActive]}
              onPress={() => setFilterElderlyAbsences(v => !v)}
            >
              <View style={[styles.filterDot, { backgroundColor: Color.Gray.v400 }]} />
              <Text style={[styles.filterChipText, filterElderlyAbsences && styles.filterChipTextActive]}>Ausências Idosos</Text>
            </TouchableOpacity>
            {/* Separator */}
            <View style={styles.filterSeparator} />
            <TouchableOpacity
              style={[styles.filterChip, filterCaregivers && styles.filterChipActive]}
              onPress={() => setFilterCaregivers(v => !v)}
            >
              <View style={[styles.filterDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={[styles.filterChipText, filterCaregivers && styles.filterChipTextActive]}>Cuidadores</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterClinicians && styles.filterChipActive]}
              onPress={() => setFilterClinicians(v => !v)}
            >
              <View style={[styles.filterDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={[styles.filterChipText, filterClinicians && styles.filterChipTextActive]}>Clínicos</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {viewMode === 'week' ? renderWeekView() : renderMonthView()}

      {selectedModal != null && renderModal()}

      {/* FAB: Add Event */}
      {userRole !== UserRole.ELDERLY && (
        <TouchableOpacity style={styles.fab} onPress={handleAddEvent} activeOpacity={0.85}>
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ProfessionalCalendarScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Header ──
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md_16,
    paddingTop: Spacing.sm_8,
    paddingBottom: Spacing.xs_4,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm_8,
  },
  navBtn: {
    padding: Spacing.xs_4,
  },
  monthTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.dark,
    marginLeft: Spacing.xs_4,
    textTransform: 'capitalize',
  },
  todayBtn: {
    backgroundColor: Color.primary + '18',
    borderRadius: 12,
    paddingHorizontal: Spacing.sm_10,
    paddingVertical: 4,
    marginRight: Spacing.xs_4,
  },
  todayBtnText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
    color: Color.primary,
  },
  viewToggleBtn: {
    padding: 5,
    borderRadius: 8,
    marginRight: Spacing.xs_4,
  },
  viewToggleBtnActive: {
    backgroundColor: Color.primary + '18',
  },

  // ── Week strip ──
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md_16,
    paddingBottom: Spacing.xs_4,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs_4,
    gap: 2,
  },
  dayLetter: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: '#9E9E9E',
    textTransform: 'uppercase',
  },
  dayLetterToday: {
    color: Color.primary,
  },
  dayNumCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumCircleSelected: {
    backgroundColor: Color.primary,
  },
  dayNumCircleToday: {
    borderWidth: 1.5,
    borderColor: Color.primary,
  },
  dayNum: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
  },
  dayNumSelected: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  dayNumToday: {
    color: Color.primary,
    fontFamily: FontFamily.bold,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  overlayLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 10,
    height: 10,
  },

  // ── Day banner (non-work / holiday / time-off) ──
  dayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.md_16,
    marginBottom: 4,
    paddingHorizontal: Spacing.sm_10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayBannerText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    flex: 1,
  },

  // ── Work hours band ──
  workHoursBand: {
    position: 'absolute',
    left: TIME_COL_WIDTH,
    right: 0,
    backgroundColor: Color.Cyan.v100 + '55',
    borderLeftWidth: 2,
    borderLeftColor: Color.Cyan.v300,
    zIndex: 0,
  },

  // ── Day label row ──
  dayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    gap: Spacing.sm_8,
    backgroundColor: '#FFFFFF',
  },
  dayLabel: {
    flex: 1,
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: '#616161',
    textTransform: 'capitalize',
  },
  eventCountBadge: {
    backgroundColor: Color.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  eventCountText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.caption_12,
    color: '#FFFFFF',
  },
  noEventsHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: '#9E9E9E',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginHorizontal: Spacing.md_16,
  },

  // ── 24h grid (week view) ──
  scrollContent: {
    paddingBottom: Spacing.xl2_40,
  },
  dayGrid: {
    position: 'relative',
    marginRight: Spacing.sm_8,
  },
  hourRow: {
    height: HOUR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeLabel: {
    width: TIME_COL_WIDTH,
    paddingRight: Spacing.sm_8,
    marginTop: -7,
    textAlign: 'right',
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#9E9E9E',
    lineHeight: 14,
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
  },
  hourLineHidden: {
    backgroundColor: 'transparent',
  },
  currentTimeRow: {
    position: 'absolute',
    left: TIME_COL_WIDTH - 5,
    right: Spacing.sm_8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA4335',
    marginRight: -1,
  },
  currentTimeBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#EA4335',
  },
  eventBlock: {
    position: 'absolute',
    left: TIME_COL_WIDTH + 4,
    right: Spacing.xs_4,
    borderRadius: 4,
    borderLeftWidth: 3,
    paddingHorizontal: Spacing.xs_6,
    paddingVertical: Spacing.xs_4,
    overflow: 'hidden',
  },
  eventTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
    lineHeight: 16,
  },
  eventPatient: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
  eventTime: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },

  // ── Month view ──
  dovRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md_16,
    marginBottom: 4,
  },
  dovLabel: {
    width: MONTH_CELL_W,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#9E9E9E',
    textTransform: 'uppercase',
    paddingVertical: 4,
  },
  mvGridRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md_16,
  },
  mvCell: {
    width: MONTH_CELL_W,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  mvDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mvDayCircleSelected: {
    backgroundColor: Color.primary,
  },
  mvDayCircleToday: {
    borderWidth: 1.5,
    borderColor: Color.primary,
  },
  mvDayNum: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
  },
  mvDayNumSelected: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  mvDayNumToday: {
    color: Color.primary,
    fontFamily: FontFamily.bold,
  },
  noEventsMonthHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: '#9E9E9E',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
  },
  mvEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md_16,
    marginBottom: Spacing.xs_6,
    borderLeftWidth: 3,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.sm_10,
    gap: Spacing.sm_8,
  },
  mvEventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  mvEventTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
  },
  mvEventSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: '#9E9E9E',
    marginTop: 1,
  },
  mvEventTime: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    flexShrink: 0,
  },

  // ── Event detail modal ──
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.md_16,
    paddingBottom: 34,
    paddingTop: Spacing.sm_8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: Spacing.sm_12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm_12,
  },
  modalTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.dark,
    lineHeight: 24,
  },
  modalTypeBadge: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  modalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginVertical: Spacing.sm_8,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: Spacing.xs_4,
    gap: Spacing.sm_10,
  },
  modalRowIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  modalRowLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: '#9E9E9E',
    marginBottom: 1,
  },
  modalRowText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
    lineHeight: 20,
  },
  modalRowSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: '#9E9E9E',
    marginTop: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs_6,
    backgroundColor: Color.primary,
    borderRadius: 12,
    paddingVertical: Spacing.sm_12,
    marginTop: Spacing.xs_4,
  },
  editBtnText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: '#FFFFFF',
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Color.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // ── Admin filter chips ──
  filterChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs_6,
    paddingBottom: Spacing.sm_8,
    paddingHorizontal: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm_10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Color.Gray.v200,
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    borderColor: Color.primary,
    backgroundColor: Color.primary + '12',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
  },
  filterChipTextActive: {
    color: Color.primary,
  },
  filterSeparator: {
    width: 1,
    height: 20,
    backgroundColor: Color.Gray.v200,
    alignSelf: 'center',
    marginHorizontal: 4,
  },
});
