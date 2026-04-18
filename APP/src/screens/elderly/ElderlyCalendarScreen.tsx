import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  CalendarEvent, CalendarEventType, FallOccurrence, SosOccurrence, UserRole,
  ElderlyAbsence, CreateElderlyAbsenceRequest,
} from 'moveplus-shared';
import { calendarEventApi } from '@src/api/endpoints/calendarEvents';
import { elderlyApi } from '@src/api/endpoints/elderly';
import { elderlyAbsenceApi } from '@src/api/endpoints/elderlyAbsence';
import { CalendarEventCard, EVENT_TYPE_CONFIG } from '@components/CalendarEventCard';
import { useAuthStore } from '@src/stores/authStore';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { DatePickerInput } from '@components/DatePickerInput';

type Props = NativeStackScreenProps<any, 'ElderlyCalendar'>;

// ── Calendar helpers ──────────────────────────────────────────────────────────
const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfWeek = (year: number, month: number) => {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday-first
};

const CELL_SIZE = 44;

const ElderlyCalendarScreen: React.FC<Props> = ({ route, navigation }) => {
  const { elderlyId, elderlyName } = route.params ?? {};
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();
  const { user } = useAuthStore();
  const userRole = user?.user?.role;
  const currentUserId = user?.user?.id;
  const canEdit = [UserRole.INSTITUTION_ADMIN, UserRole.CAREGIVER, UserRole.PROGRAMMER, UserRole.CLINICIAN].includes(userRole);
  const canCreate = [UserRole.INSTITUTION_ADMIN, UserRole.CAREGIVER, UserRole.PROGRAMMER, UserRole.CLINICIAN].includes(userRole);

  const today = new Date();

  const canEditEvent = (event: CalendarEvent) => {
    if (!canEdit) return false;
    // Admins can edit everything, including past events
    if (userRole === UserRole.INSTITUTION_ADMIN) return true;
    // Past events cannot be edited, except all-day events on today
    const isPast = new Date(event.startDate) < today;
    if (isPast) {
      const startDate = new Date(event.startDate);
      const isToday =
        startDate.getFullYear() === today.getFullYear() &&
        startDate.getMonth() === today.getMonth() &&
        startDate.getDate() === today.getDate();
      if (!event.allDay || !isToday) return false;
    }
    return true;
  };

  const canDeleteEvent = (event: CalendarEvent) => {
    if (!canEdit) return false;
    if (userRole === UserRole.INSTITUTION_ADMIN) return true;
    return event.createdById === currentUserId;
  };

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [fallOccurrences, setFallOccurrences] = useState<FallOccurrence[]>([]);
  const [sosOccurrences, setSosOccurrences] = useState<SosOccurrence[]>([]);
  const [absences, setAbsences] = useState<ElderlyAbsence[]>([]);
  const [loading, setLoading] = useState(true);

  // Absence modal state
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceStart, setAbsenceStart] = useState<Date>(new Date());
  const [absenceEnd, setAbsenceEnd] = useState<Date>(new Date());
  const [absenceReason, setAbsenceReason] = useState('');
  const [savingAbsence, setSavingAbsence] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const [eventsRes, elderlyRes, absencesRes] = await Promise.all([
        calendarEventApi.getEvents(elderlyId),
        elderlyApi.getElderly(elderlyId),
        elderlyAbsenceApi.getAbsences(elderlyId).catch(() => ({ data: [] as ElderlyAbsence[] })),
      ]);
      setEvents(eventsRes.data);
      setFallOccurrences(elderlyRes.data.fallOccurrences ?? []);
      setSosOccurrences(elderlyRes.data.sosOccurrences ?? []);
      setAbsences(absencesRes.data ?? []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [elderlyId]);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  // ── Derived data ──────────────────────────────────────────────────────────
  const monthEvents = events.filter(e => {
    const d = new Date(e.startDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Map day → colors (up to 4 dot types per day)
  const dayColors = new Map<number, string[]>();
  for (const e of monthEvents) {
    const day = new Date(e.startDate).getDate();
    const color = (EVENT_TYPE_CONFIG[e.type] ?? EVENT_TYPE_CONFIG[CalendarEventType.OTHER]).color;
    const existing = dayColors.get(day) ?? [];
    if (!existing.includes(color) && existing.length < 4) {
      dayColors.set(day, [...existing, color]);
    }
  }
  // Add fall occurrence dots (purple)
  for (const f of fallOccurrences) {
    const d = new Date(f.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      const existing = dayColors.get(day) ?? [];
      if (!existing.includes('#7B1FA2') && existing.length < 4) {
        dayColors.set(day, [...existing, '#7B1FA2']);
      }
    }
  }
  // Add SOS occurrence dots (amber)
  for (const s of sosOccurrences) {
    const d = new Date(s.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      const existing = dayColors.get(day) ?? [];
      if (!existing.includes(Color.Warning.amber) && existing.length < 4) {
        dayColors.set(day, [...existing, Color.Warning.amber]);
      }
    }
  }

  /** Returns true if the given day number (in the displayed month) is within an absence period */
  const isDayAbsent = (day: number): boolean => {
    const d = new Date(year, month, day);
    d.setHours(12, 0, 0, 0);
    return absences.some(a => {
      const start = new Date(a.startDate); start.setHours(0, 0, 0, 0);
      const end = new Date(a.endDate); end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });
  };

  const selectedDayEvents = events.filter(e => {
    const d = new Date(e.startDate);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
  });

  const selectedDayFalls = fallOccurrences.filter(f => {
    const d = new Date(f.date);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
  });

  const selectedDaySos = sosOccurrences.filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
  });

  const selectedDayAbsences = absences.filter(a => {
    const d = new Date(year, month, selectedDay);
    d.setHours(12, 0, 0, 0);
    const start = new Date(a.startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(a.endDate); end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  });

  // ── Absence modal handlers ───────────────────────────────────────────────
  const openAddAbsence = () => {
    const initial = new Date(year, month, selectedDay);
    setAbsenceStart(initial);
    setAbsenceEnd(initial);
    setAbsenceReason('');
    setShowAbsenceModal(true);
  };

  const saveAbsence = async () => {
    if (absenceEnd < absenceStart) {
      Alert.alert('Erro', 'A data de fim tem de ser igual ou posterior à de início.');
      return;
    }
    try {
      setSavingAbsence(true);
      const payload: CreateElderlyAbsenceRequest = {
        startDate: absenceStart,
        endDate: absenceEnd,
        reason: absenceReason || null,
      };
      const res = await elderlyAbsenceApi.createAbsence(elderlyId, payload);
      setAbsences(prev => [...prev, res.data]);
      setShowAbsenceModal(false);
    } catch (err) {
      handleError(err);
    } finally {
      setSavingAbsence(false);
    }
  };

  const deleteAbsence = (absence: ElderlyAbsence) => {
    Alert.alert(
      'Apagar ausência',
      `Apagar ausência de ${new Date(absence.startDate).toLocaleDateString('pt-PT')} a ${new Date(absence.endDate).toLocaleDateString('pt-PT')}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar', style: 'destructive', onPress: async () => {
            try {
              await elderlyAbsenceApi.deleteAbsence(absence.id);
              setAbsences(prev => prev.filter(a => a.id !== absence.id));
            } catch (err) {
              handleError(err);
            }
          },
        },
      ],
    );
  };

  // ── Navigation ──────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(1);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
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

  const handleEventPress = (event: CalendarEvent) => {
    const edit = canEditEvent(event);
    const del = canDeleteEvent(event);
    if (edit && del) {
      Alert.alert(
        event.title,
        undefined,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('calendar.editEvent'), onPress: () => navigation.push('AddCalendarEvent', { elderlyId, editEvent: event }) },
          { text: t('calendar.deleteEvent'), style: 'destructive', onPress: () => handleDeleteEvent(event) },
        ]
      );
    } else if (edit) {
      navigation.push('AddCalendarEvent', { elderlyId, editEvent: event });
    } else if (del) {
      handleDeleteEvent(event);
    }
  };

  if (loading) return <ActivityIndicatorOverlay />;

  // ── Calendar grid ──────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const DOW_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={fetchEvents} />}
      >
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <MaterialIcons name="chevron-left" size={24} color={Color.dark} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <MaterialIcons name="chevron-right" size={24} color={Color.dark} />
          </TouchableOpacity>
        </View>

        {/* Day-of-week header */}
        <View style={styles.dowRow}>
          {DOW_LABELS.map(d => (
            <Text key={d} style={styles.dowLabel}>{d}</Text>
          ))}
        </View>

        {/* Calendar cells */}
        <View style={styles.grid}>
          {cells.map((day, idx) => {
            if (!day) return <View key={`empty-${idx}`} style={styles.cell} />;
            const selected = day === selectedDay;
            const dots = dayColors.get(day) ?? [];
            const absent = isDayAbsent(day);
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.cell,
                  absent && styles.cellAbsent,
                  selected && styles.cellSelected,
                  isToday(day) && !selected && styles.cellToday,
                ]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayText, selected && styles.dayTextSelected, isToday(day) && !selected && styles.dayTextToday]}>
                  {day}
                </Text>
                {dots.length > 0 && (
                  <View style={styles.dotsRow}>
                    {dots.map((color, i) => (
                      <View key={i} style={[styles.dot, { backgroundColor: selected ? Color.white : color }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add button + day events */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              {selectedDay} {new Date(year, month, selectedDay).toLocaleString('default', { month: 'long' })}
            </Text>
            <View style={styles.headerBtns}>
              {canCreate && (
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: '#64748B' }]}
                  onPress={openAddAbsence}
                >
                  <MaterialIcons name="person-off" size={16} color={Color.white} />
                </TouchableOpacity>
              )}
              {canCreate && (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => navigation.push('AddCalendarEvent', {
                    elderlyId,
                    selectedDate: new Date(year, month, selectedDay).toISOString(),
                  })}
                >
                  <MaterialIcons name="add" size={20} color={Color.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {selectedDayEvents.length === 0 && selectedDayFalls.length === 0 && selectedDaySos.length === 0 && selectedDayAbsences.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="event-busy" size={32} color={Color.Gray.v300} />
              <Text style={styles.emptyText}>{t('calendar.noEvents')}</Text>
              {canCreate && <Text style={styles.emptySubtext}>{t('calendar.noEventsDescription')}</Text>}
            </View>
          ) : (
            <View style={styles.eventList}>
              {selectedDayEvents
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map(event => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onPress={(canEditEvent(event) || canDeleteEvent(event)) ? handleEventPress : undefined}
                    onLongPress={canDeleteEvent(event) ? handleDeleteEvent : undefined}
                  />
                ))}
              {selectedDayFalls.map(fall => (
                <View key={`fall-${fall.id}`} style={styles.occurrenceCard}>
                  <View style={[styles.occurrenceIcon, { backgroundColor: '#7B1FA215' }]}>
                    <MaterialIcons name="warning" size={20} color="#7B1FA2" />
                  </View>
                  <View style={styles.occurrenceContent}>
                    <Text style={[styles.occurrenceTitle, { color: '#7B1FA2' }]}>{t('elderly.fallOccurrences')}</Text>
                    {fall.description ? <Text style={styles.occurrenceDesc} numberOfLines={2}>{fall.description}</Text> : null}
                    <Text style={styles.occurrenceTime}>
                      {new Date(fall.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {fall.injured ? ` · ${t('elderly.injured')}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
              {selectedDaySos.map(sos => (
                <View key={`sos-${sos.id}`} style={styles.occurrenceCard}>
                  <View style={[styles.occurrenceIcon, { backgroundColor: Color.Warning.amber + '15' }]}>
                    <MaterialIcons name="sos" size={20} color={Color.Warning.amber} />
                  </View>
                  <View style={styles.occurrenceContent}>
                    <Text style={[styles.occurrenceTitle, { color: Color.Warning.amber }]}>{t('elderly.sosOccurrences')}</Text>
                    {sos.notes ? <Text style={styles.occurrenceDesc} numberOfLines={2}>{sos.notes}</Text> : null}
                    <Text style={styles.occurrenceTime}>
                      {new Date(sos.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))}
              {selectedDayAbsences.map(absence => (
                <View key={`absence-${absence.id}`} style={[styles.occurrenceCard, { borderLeftColor: '#64748B' }]}>
                  <View style={[styles.occurrenceIcon, { backgroundColor: '#64748B15' }]}>
                    <MaterialIcons name="person-off" size={20} color="#64748B" />
                  </View>
                  <View style={styles.occurrenceContent}>
                    <Text style={[styles.occurrenceTitle, { color: '#64748B' }]}>Utente fora do lar</Text>
                    {absence.reason ? <Text style={styles.occurrenceDesc} numberOfLines={2}>{absence.reason}</Text> : null}
                    <Text style={styles.occurrenceTime}>
                      {new Date(absence.startDate).toLocaleDateString('pt-PT')} – {new Date(absence.endDate).toLocaleDateString('pt-PT')}
                    </Text>
                  </View>
                  {canEdit && (
                    <TouchableOpacity onPress={() => deleteAbsence(absence)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialIcons name="delete-outline" size={18} color={Color.Error.default} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Absence Modal */}
      <Modal
        visible={showAbsenceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAbsenceModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000040' }}>
          <View style={{
            backgroundColor: Color.Background.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: Spacing.md_16,
            gap: Spacing.sm_12,
          }}>
            <Text style={{ fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodymedium_16, color: Color.dark }}>
              Registar ausência
            </Text>
            <DatePickerInput
              label="Data de início"
              value={absenceStart}
              onChange={setAbsenceStart}
            />
            <DatePickerInput
              label="Data de fim"
              value={absenceEnd}
              onChange={setAbsenceEnd}
            />
            <TextInput
              placeholder="Motivo (opcional)"
              value={absenceReason}
              onChangeText={setAbsenceReason}
              style={{
                borderWidth: 1,
                borderColor: Color.Gray.v200,
                borderRadius: Border.sm_8,
                padding: Spacing.sm_12,
                fontFamily: FontFamily.regular,
                fontSize: FontSize.bodysmall_14,
                color: Color.dark,
              }}
              placeholderTextColor={Color.Gray.v400}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm_8 }}>
              <TouchableOpacity
                onPress={() => setShowAbsenceModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: Spacing.sm_12,
                  borderRadius: Border.sm_8,
                  borderWidth: 1,
                  borderColor: Color.Gray.v200,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: FontFamily.medium, color: Color.Gray.v500 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveAbsence}
                disabled={savingAbsence || !absenceStart || !absenceEnd}
                style={{
                  flex: 1,
                  paddingVertical: Spacing.sm_12,
                  borderRadius: Border.sm_8,
                  backgroundColor: Color.primary,
                  alignItems: 'center',
                  opacity: (savingAbsence || !absenceStart || !absenceEnd) ? 0.5 : 1,
                }}
              >
                <Text style={{ fontFamily: FontFamily.medium, color: Color.white }}>
                  {savingAbsence ? 'A guardar…' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ElderlyCalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
    paddingHorizontal: Spacing.md_16,
    paddingTop: Spacing.md_16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm_8,
  },
  navBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Border.sm_8,
    backgroundColor: Color.Background.white,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  monthTitle: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    textTransform: 'capitalize',
  },
  dowRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xs_4,
  },
  dowLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 2,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Border.sm_8,
    marginHorizontal: 1,
  },
  cellSelected: {
    backgroundColor: Color.primary,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: Color.primary,
  },
  dayText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.dark,
  },
  dayTextSelected: {
    color: Color.white,
    fontFamily: FontFamily.semi_bold,
  },
  dayTextToday: {
    color: Color.primary,
    fontFamily: FontFamily.semi_bold,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  eventsSection: {
    marginTop: Spacing.md_16,
    paddingBottom: Spacing.xl_32,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm_12,
  },
  eventsSectionTitle: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    textTransform: 'capitalize',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: Border.full,
    backgroundColor: Color.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cellAbsent: {
    backgroundColor: '#64748B15',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl_32,
    gap: Spacing.sm_8,
  },
  emptyText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  eventList: {
    gap: Spacing.sm_8,
  },
  occurrenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    borderLeftWidth: 4,
    borderLeftColor: '#7B1FA2',
    padding: Spacing.md_16,
    gap: Spacing.sm_12,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  occurrenceIcon: {
    width: 40,
    height: 40,
    borderRadius: Border.sm_8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  occurrenceContent: {
    flex: 1,
  },
  occurrenceTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
  },
  occurrenceDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v500,
    marginTop: 2,
  },
  occurrenceTime: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
    marginTop: 2,
  },
});
