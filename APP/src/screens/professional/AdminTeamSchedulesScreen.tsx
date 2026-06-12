import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  TimeOffType, TimeOffStatus, VacationPolicy,
  RespondTimeOffRequest, UpsertVacationPolicyRequest,
} from 'moveplus-shared';
import { timeOffApi, StaffTimeOffWithUser } from '@src/api/endpoints/timeOff';
import { institutionApi } from '@src/api/endpoints/institution';
import { staffScheduleApi, StaffScheduleSummary } from '@src/api/endpoints/staffSchedule';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { useErrorHandler } from '@src/hooks/useErrorHandler';

type Props = NativeStackScreenProps<any, 'AdminTeamSchedules'>;

const TIME_OFF_LABELS: Record<TimeOffType, string> = {
  [TimeOffType.VACATION]:   'Férias',
  [TimeOffType.DAY_OFF]:    'Folga',
  [TimeOffType.SICK_LEAVE]: 'Baixa médica',
};

const TIME_OFF_COLORS: Record<TimeOffType, string> = {
  [TimeOffType.VACATION]:   '#22C55E',
  [TimeOffType.DAY_OFF]:    '#F97316',
  [TimeOffType.SICK_LEAVE]: '#A855F7',
};

const STATUS_LABELS: Record<TimeOffStatus, string> = {
  [TimeOffStatus.PENDING]:  'Pendente',
  [TimeOffStatus.APPROVED]: 'Aprovado',
  [TimeOffStatus.DENIED]:   'Recusado',
};

const STATUS_COLORS: Record<TimeOffStatus, string> = {
  [TimeOffStatus.PENDING]:  '#F97316',
  [TimeOffStatus.APPROVED]: '#22C55E',
  [TimeOffStatus.DENIED]:   '#EF4444',
};

const ROLE_LABELS: Record<string, string> = {
  CAREGIVER: 'Cuidador',
  CLINICIAN: 'Clínico',
  INSTITUTION_ADMIN: 'Admin',
  PROGRAMMER: 'Programador',
};

function formatShortDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatPresenceDate(d: Date): string {
  return d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' });
}

function isDateInRange(date: Date, startStr: string, endStr: string): boolean {
  const d = date.getTime();
  const start = new Date(startStr).setHours(0, 0, 0, 0);
  const end = new Date(endStr).setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}

type PresenceInfo =
  | { status: 'absent' | 'no-schedule' }
  | { status: 'present'; timeRange: string; startTimeStr: string };

function getPresenceInfo(s: StaffScheduleSummary, date: Date): PresenceInfo {
  const hasTimeOff = s.timeOffs.some(t =>
    isDateInRange(date, t.startDate as string, t.endDate as string)
  );
  if (hasTimeOff) return { status: 'absent' };
  if (!s.schedule || !s.schedule.slots) return { status: 'no-schedule' };
  
  const jsDay = date.getDay();
  const isoDay = jsDay === 0 ? 7 : jsDay;

  const activeSlot = s.schedule.slots.find((slot: any) => slot.dayIso === isoDay);
  if (!activeSlot || !activeSlot.isActive) return { status: 'absent' };

  return { 
    status: 'present', 
    timeRange: `${activeSlot.startTime}–${activeSlot.endTime}`,
    startTimeStr: activeSlot.startTime 
  };
}

function calculateTimelineBars(timeRange: string) {
  const defaultProps = { isNightSplit: false, left1: 0, width1: 0, left2: 0, width2: 0 };
  
  if (!timeRange) return defaultProps;
  
  const [startStr, endStr] = timeRange.split('–');
  if (!startStr || !endStr) return defaultProps;
  
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return defaultProps;
  
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  // Turno da noite (Passa da meia-noite)
  if (endMins < startMins) {
    return {
      isNightSplit: true,
      left1: (startMins / 1440) * 100,
      width1: ((1440 - startMins) / 1440) * 100,
      left2: 0,
      width2: (endMins / 1440) * 100
    };
  }

  // Turno normal diurno
  return {
    isNightSplit: false,
    left1: (startMins / 1440) * 100,
    width1: ((endMins - startMins) / 1440) * 100,
    left2: 0,
    width2: 0 // Definido explicitamente como 0 em vez de ficar ausente
  };
}

// HELPER HOSPITALAR: Gera os 7 dias da semana com base no dia selecionado
function getDaysOfCurrentWeek(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Força início a uma Segunda-feira
  start.setDate(start.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

type StaffMember = { id: number; userId: number; name: string; role: string };

const AdminTeamSchedulesScreen: React.FC<Props> = ({ navigation }) => {
  const { handleError } = useErrorHandler();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeOffs, setTimeOffs] = useState<StaffTimeOffWithUser[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [vacationPolicy, setVacationPolicy] = useState<VacationPolicy | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyDays, setPolicyDays] = useState('22');
  const [denyModalItem, setDenyModalItem] = useState<StaffTimeOffWithUser | null>(null);
  const [denyNote, setDenyNote] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');
  const [presenceDate, setPresenceDate] = useState<Date>(new Date());
  const [institutionSchedules, setInstitutionSchedules] = useState<StaffScheduleSummary[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [toRes, policyRes, membersRes, schedRes] = await Promise.all([
        timeOffApi.getInstitutionTimeOffs().catch(() => ({ data: [] as StaffTimeOffWithUser[] })),
        timeOffApi.getVacationPolicy().catch(() => ({ data: null })),
        institutionApi.getInstitutionUsers().catch(() => ({ data: { caregivers: [], clinicians: [], admins: [], elderly: [] } })),
        staffScheduleApi.getInstitutionSchedules().catch(() => ({ data: [] as StaffScheduleSummary[] })),
      ]);
      setTimeOffs(toRes.data ?? []);
      if (policyRes.data) {
        setVacationPolicy(policyRes.data);
        setPolicyDays(String(policyRes.data.maxVacationDaysPerYear));
      }
      const members = membersRes.data;
      const allStaff: StaffMember[] = [
        ...(members.caregivers ?? []).map(c => ({ id: c.id, userId: c.userId, name: c.name, role: 'CAREGIVER' })),
        ...(members.clinicians ?? []).map(c => ({ id: c.id, userId: c.userId, name: c.name, role: 'CLINICIAN' })),
        ...(members.admins ?? []).map(a => ({ id: a.id, userId: a.userId, name: a.name, role: 'INSTITUTION_ADMIN' })),
      ];
      setStaff(allStaff);
      setInstitutionSchedules(schedRes.data ?? []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const approveTimeOff = async (to: StaffTimeOffWithUser) => {
    try {
      setSaving(true);
      const payload: RespondTimeOffRequest = { status: TimeOffStatus.APPROVED };
      const updated = await timeOffApi.respondTimeOff(to.id, payload);
      setTimeOffs(prev => prev.map(t => t.id === to.id ? { ...t, ...updated.data } : t));
      Alert.alert('Aprovado', `Pedido de ${to.user.name} aprovado.`);
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const openDenyModal = (to: StaffTimeOffWithUser) => {
    setDenyModalItem(to);
    setDenyNote('');
  };

  const confirmDeny = async () => {
    if (!denyModalItem) return;
    try {
      setSaving(true);
      const payload: RespondTimeOffRequest = { status: TimeOffStatus.DENIED, responseNote: denyNote || undefined };
      const updated = await timeOffApi.respondTimeOff(denyModalItem.id, payload);
      setTimeOffs(prev => prev.map(t => t.id === denyModalItem.id ? { ...t, ...updated.data } : t));
      setDenyModalItem(null);
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const savePolicy = async () => {
    const days = parseInt(policyDays, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      Alert.alert('Erro', 'Introduza um número de dias válido (1–365).');
      return;
    }
    try {
      setSaving(true);
      const payload: UpsertVacationPolicyRequest = { maxVacationDaysPerYear: days };
      const result = await timeOffApi.upsertVacationPolicy(payload);
      setVacationPolicy(result.data);
      setShowPolicyModal(false);
      Alert.alert('Guardado', 'Política de férias actualizada.');
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const currentWeekDays = useMemo(() => getDaysOfCurrentWeek(presenceDate), [presenceDate]);

  const displayedTimeOffs = filter === 'pending'
    ? timeOffs.filter(t => t.status === TimeOffStatus.PENDING)
    : timeOffs;

  if (loading) return <ActivityIndicatorOverlay />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Pending / All Filter ── */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'pending' && styles.filterChipActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
              Pendentes ({timeOffs.filter(t => t.status === TimeOffStatus.PENDING).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Todos ({timeOffs.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Time-off Requests ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="beach-access" size={20} color={Color.Orange.v300} />
            <Text style={styles.sectionTitle}>
              {filter === 'pending' ? 'Pedidos Pendentes' : 'Todos os Pedidos'}
            </Text>
          </View>

          {displayedTimeOffs.length === 0 ? (
            <Text style={styles.emptyText}>
              {filter === 'pending' ? 'Não há pedidos pendentes.' : 'Nenhum pedido registado.'}
            </Text>
          ) : (
            displayedTimeOffs.map(to => {
              const typeColor = TIME_OFF_COLORS[to.type];
              const statusColor = STATUS_COLORS[to.status ?? TimeOffStatus.APPROVED];
              const isPending = to.status === TimeOffStatus.PENDING;

              return (
                <View key={to.id} style={[styles.timeOffRow, { borderLeftColor: typeColor }]}>
                  <View style={styles.timeOffBody}>
                    <View style={styles.timeOffBadgeRow}>
                      <View style={[styles.badge, { backgroundColor: typeColor + '22' }]}>
                        <Text style={[styles.badgeText, { color: typeColor }]}>{TIME_OFF_LABELS[to.type]}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
                        <Text style={[styles.badgeText, { color: statusColor }]}>
                          {STATUS_LABELS[to.status ?? TimeOffStatus.APPROVED]}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.staffName}>{to.user?.name ?? '—'}</Text>
                    <Text style={styles.dateText}>
                      {formatShortDate(to.startDate)} – {formatShortDate(to.endDate)}
                    </Text>
                    {!!to.note && <Text style={styles.noteText}>{to.note}</Text>}
                    {!!to.responseNote && (
                      <Text style={[styles.noteText, { color: statusColor }]}>{to.responseNote}</Text>
                    )}
                  </View>
                  {isPending && (
                    <View style={styles.actionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#DCFCE7' }]}
                        onPress={() => approveTimeOff(to)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="check" size={20} color="#22C55E" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                        onPress={() => openDenyModal(to)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="close" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ── Team Members ── */}
        {staff.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="groups" size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Equipa</Text>
            </View>
            {staff.map(member => (
              <TouchableOpacity
                key={member.userId}
                style={styles.memberRow}
                onPress={() => navigation.push('StaffScheduleManagement', { userId: member.userId, staffName: member.name })}
                activeOpacity={0.75}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{ROLE_LABELS[member.role] ?? member.role}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Color.Gray.v400} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── 🏥 DAILY PRESENCE SECTION (REMODELAÇÃO ESTILO HOSPITALAR) ── */}
        {institutionSchedules.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="dashboard" size={20} color={Color.primary} />
              <Text style={styles.sectionTitle}>Quadro de Escala Diária</Text>
              <TouchableOpacity style={styles.presenceTodayBtn} onPress={() => setPresenceDate(new Date())}>
                <Text style={styles.presenceTodayText}>Hoje</Text>
              </TouchableOpacity>
            </View>

            {/* 🗓️ HOSPITAL SLIDER: Fita de calendário semanal deslizante rápida */}
            <View style={styles.calendarStripContainer}>
              {currentWeekDays.map((day, idx) => {
                const isSelected = day.getDate() === presenceDate.getDate() && day.getMonth() === presenceDate.getMonth();
                const isToday = new Date().getDate() === day.getDate() && new Date().getMonth() === day.getMonth();
                const weekdaysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.stripDayButton, isSelected && styles.stripDayButtonActive]}
                    onPress={() => setPresenceDate(day)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.stripDayLabel, isSelected && styles.stripDayLabelActive]}>
                      {weekdaysShort[day.getDay()]}
                    </Text>
                    <View style={[styles.stripDayCircle, isToday && !isSelected && styles.stripTodayBorder, isSelected && styles.stripDayCircleActive]}>
                      <Text style={[styles.stripDayNum, isSelected && styles.stripDayNumActive, isToday && !isSelected && { color: Color.primary, fontFamily: FontFamily.bold }]}>
                        {day.getDate()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.presenceTextTitle}>{formatPresenceDate(presenceDate)}</Text>

            {(() => {
              const infos = institutionSchedules.map(s => ({ s, info: getPresenceInfo(s, presenceDate) }));
              const present = infos.filter(x => x.info.status === 'present') as { s: StaffScheduleSummary; info: Extract<PresenceInfo, { status: 'present' }> }[];
              const absent  = infos.filter(x => x.info.status !== 'present');

              // Ordena do trabalhador que entra mais cedo para o mais tardio
              present.sort((a, b) => a.info.startTimeStr.localeCompare(b.info.startTimeStr));

              return (
                <>
                  {/* GRÁFICO DE TIMELINE: EQUIPA EM SERVIÇO */}
                  {present.length > 0 && (
                    <View style={{ marginBottom: Spacing.xs_6 }}>
                      <View style={[styles.shiftHeader, { borderLeftColor: '#22C55E', marginBottom: 12 }]}>
                        <MaterialIcons name="people" size={16} color="#22C55E" />
                        <Text style={[styles.shiftHeaderText, { color: '#22C55E' }]}>Equipa ao Serviço ({present.length})</Text>
                      </View>

                      {/* Legenda de marcas temporais da escala */}
                      <View style={styles.timelineLegend}>
                        <Text style={styles.legendTick}>00h</Text>
                        <Text style={styles.legendTick}>06h</Text>
                        <Text style={styles.legendTick}>12h</Text>
                        <Text style={styles.legendTick}>18h</Text>
                        <Text style={styles.legendTick}>24h</Text>
                      </View>
                      
                      {present.map(({ s, info }) => {
                        const tProps = calculateTimelineBars(info.timeRange);
                        return (
                          <View key={s.userId} style={styles.hospitalStaffCard}>
                            <View style={styles.hospitalCardMeta}>
                              <Text style={styles.hospitalStaffName} numberOfLines={1}>{s.name}</Text>
                              <Text style={styles.hospitalStaffHours}>{info.timeRange}</Text>
                            </View>

                            
                            <TouchableOpacity 
                              style={styles.ganttTrackContainer}
                              activeOpacity={0.7}
                              onPress={() => Alert.alert(
                                'Escala de Serviço',
                                `Funcionário: ${s.name}\nHorário de Trabalho: ${info.timeRange}`
                              )}
                            >
                              <View style={styles.ganttTrackGridLine} />
                              <View style={[styles.ganttTrackGridLine, { left: '25%' }]} />
                              <View style={[styles.ganttTrackGridLine, { left: '50%' }]} />
                              <View style={[styles.ganttTrackGridLine, { left: '75%' }]} />

                              {tProps.isNightSplit ? (
                                <>
                                  <View style={[styles.ganttActiveFill, { left: `${tProps.left1}%`, width: `${tProps.width1}%` }]} />
                                  <View style={[styles.ganttActiveFill, { left: `${tProps.left2}%`, width: `${tProps.width2}%` }]} />
                                </>
                              ) : (
                                <View style={[styles.ganttActiveFill, { left: `${tProps.left1}%`, width: `${tProps.width1}%` }]} />
                              )}
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* ⚪ LISTAGEM: INDISPONÍVEIS / FOLGAS / BAIXAS */}
                  {absent.length > 0 && (
                    <View style={{ marginTop: Spacing.sm_8 }}>
                      <View style={[styles.shiftHeader, { borderLeftColor: '#94A3B8', marginBottom: Spacing.xs_4 }]}>
                        <MaterialIcons name="block" size={16} color="#94A3B8" />
                        <Text style={[styles.shiftHeaderText, { color: '#94A3B8' }]}>Ausentes ou de Folga ({absent.length})</Text>
                      </View>
                      
                      <View style={styles.absentGridRow}>
                        {absent.map(({ s, info }) => {
                          const isRealAbsent = info.status === 'absent';
                          const badgeColor = isRealAbsent ? '#EF4444' : '#64748B';
                          return (
                            <View key={s.userId} style={styles.hospitalAbsentCard}>
                              <MaterialIcons name={isRealAbsent ? "event-busy" : "nights-stay"} size={16} color={badgeColor} />
                              <Text style={styles.hospitalAbsentName} numberOfLines={1}>{s.name}</Text>
                              <View style={[styles.hospitalAbsentBadge, { backgroundColor: badgeColor + '15' }]}>
                                <Text style={[styles.hospitalAbsentBadgeText, { color: badgeColor }]}>
                                  {isRealAbsent ? 'Ausente/Férias' : 'Folga'}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        )}

        {/* ── Vacation Policy ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="policy" size={20} color={Color.primary} />
            <Text style={styles.sectionTitle}>Política de Férias</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setShowPolicyModal(true)}>
              <MaterialIcons name="edit" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          {vacationPolicy ? (
            <View style={styles.policyCard}>
              <Text style={styles.policyNumber}>{vacationPolicy.maxVacationDaysPerYear}</Text>
              <Text style={styles.policyLabel}>dias máximos de férias por trabalhador / ano</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Nenhuma política definida. Prima editar para configurar.
            </Text>
          )}
        </View>

      </ScrollView>

      {/* ── Deny Modal ── */}
      <Modal visible={!!denyModalItem} transparent animationType="slide" onRequestClose={() => setDenyModalItem(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDenyModalItem(null)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ justifyContent: 'flex-end' }}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Recusar pedido</Text>
            <Text style={styles.fieldLabel}>Motivo (opcional)</Text>
            <TextInput
              style={styles.textInput}
              value={denyNote}
              onChangeText={setDenyNote}
              placeholder="Ex: Período já ocupado"
              multiline
              numberOfLines={3}
              returnKeyType="done"
              blurOnSubmit
            />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#EF4444', marginTop: 4 }]} onPress={confirmDeny} disabled={saving}>
              <MaterialIcons name="close" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Recusar pedido</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Custom Pop-up da Política de Férias ── */}
      {showPolicyModal && (
        <View style={styles.popupOverlay}>
          <TouchableOpacity 
            style={styles.popupBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowPolicyModal(false)} 
          />
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.popupKeyboardAvoiding}
          >
            <View style={styles.popupAlertBox}>
              <Text style={styles.modalTitle}>Política de Férias</Text>
              <Text style={styles.fieldLabel}>Máximo de dias de férias por trabalhador por ano (1 – 365)</Text>
              <TextInput
                style={styles.timeInput}
                value={policyDays}
                onChangeText={setPolicyDays}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="22"
                returnKeyType="done"
                onSubmitEditing={savePolicy}
              />
              <TouchableOpacity 
                style={[styles.saveBtn, { marginTop: Spacing.sm_8, width: '100%' }]} 
                onPress={savePolicy} 
                disabled={saving}
              >
                <MaterialIcons name="save" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Guardar política</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {saving && <ActivityIndicatorOverlay />}
    </SafeAreaView>
  );
};

export default AdminTeamSchedulesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Color.Background.muted },
  content: { padding: Spacing.md_16, gap: Spacing.md_16, paddingBottom: 40 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: Color.Gray.v200,
    backgroundColor: '#fff',
  },
  filterChipActive: { borderColor: Color.primary, backgroundColor: Color.primary + '15' },
  filterText: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.Gray.v400 },
  filterTextActive: { color: Color.primary },
  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: Spacing.md_16,
    gap: Spacing.sm_10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm_8 },
  sectionTitle: {
    flex: 1, fontFamily: FontFamily.bold, fontSize: FontSize.bodylarge_18, color: Color.dark,
  },
  editBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Color.primary, alignItems: 'center', justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.regular, fontSize: FontSize.caption_12,
    color: Color.Gray.v400, textAlign: 'center', paddingVertical: 8,
  },
  timeOffRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderLeftWidth: 3, borderRadius: 8,
    backgroundColor: Color.Background.subtle,
    paddingVertical: 10, paddingHorizontal: 10,
  },
  timeOffBody: { flex: 1, gap: 3 },
  timeOffBadgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontFamily: FontFamily.semi_bold, fontSize: 10 },
  staffName: { fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodysmall_14, color: Color.dark },
  dateText: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.Gray.v500 },
  noteText: { fontFamily: FontFamily.regular, fontSize: 11, color: Color.Gray.v400 },
  actionBtns: { flexDirection: 'column', gap: 6 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Color.Gray.v100,
  },
  memberAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Color.primary + '22', alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.bodymedium_16, color: Color.primary },
  memberName: { fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodysmall_14, color: Color.dark },
  memberRole: { fontFamily: FontFamily.regular, fontSize: FontSize.caption_12, color: Color.Gray.v400 },
  policyCard: { alignItems: 'center', paddingVertical: 12 },
  policyNumber: { fontFamily: FontFamily.bold, fontSize: 48, color: Color.primary },
  policyLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.caption_12, color: Color.Gray.v400 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: Spacing.md_16, paddingBottom: 34, gap: Spacing.sm_8,
  },
  modalHandle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: Color.Gray.v200, marginBottom: 8,
  },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.bodylarge_18, color: Color.dark, marginBottom: 4 },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.Gray.v400, marginBottom: 2 },
  textInput: {
    borderWidth: 1.5, borderColor: Color.Gray.v200, borderRadius: 10,
    padding: Spacing.sm_10, fontFamily: FontFamily.regular, fontSize: FontSize.bodysmall_14,
    color: Color.dark, minHeight: 60, textAlignVertical: 'top',
  },
  timeInput: {
    borderWidth: 1.5, borderColor: Color.Gray.v200, borderRadius: 10,
    paddingHorizontal: Spacing.sm_12, paddingVertical: Spacing.sm_10,
    fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.dark,
    backgroundColor: Color.Background.subtle,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Color.primary, borderRadius: 12,
    paddingVertical: Spacing.sm_12, marginTop: 4,
  },
  saveBtnText: { fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodysmall_14, color: '#fff' },
  
  // ── ESCALA CLINICA ──
  presenceNav: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  presenceNavBtn: { padding: 4 },
  presenceDateText: {
    flex: 1, textAlign: 'center',
    fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodysmall_14, color: Color.dark,
  },
  presenceTodayBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: Color.primary + '18',
  },
  presenceTodayText: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.primary },
  shiftHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderLeftWidth: 3.5, paddingLeft: 8, paddingVertical: 2,
    marginTop: 6, marginBottom: 4,
  },
  shiftHeaderText: { fontFamily: FontFamily.bold, fontSize: FontSize.caption_12 },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  popupKeyboardAvoiding: {
    flex: 1, 
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupAlertBox: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: Spacing.md_16,
    gap: Spacing.sm_8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  calendarStripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Color.Background.subtle,
    borderRadius: 12,
    padding: 6,
    marginVertical: 4,
  },
  stripDayButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  stripDayButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stripDayLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Color.Gray.v400,
  },
  stripDayLabelActive: {
    color: Color.primary,
    fontFamily: FontFamily.bold,
  },
  stripDayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripDayCircleActive: {
    backgroundColor: Color.primary,
  },
  stripTodayBorder: {
    borderWidth: 1.5,
    borderColor: Color.primary + '60',
  },
  stripDayNum: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Color.dark,
  },
  stripDayNumActive: {
    color: '#fff',
    fontFamily: FontFamily.bold,
  },
  presenceTextTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
    textTransform: 'capitalize',
    marginTop: 6,
    marginBottom: 2,
    paddingLeft: 2,
  },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 96, // Alinha perfeitamente com a Gantt chart pulando os nomes
    paddingRight: 4,
    marginBottom: 4,
  },
  legendTick: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: Color.Gray.v400,
  },
  hospitalStaffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v100,
    gap: 12,
  },
  hospitalCardMeta: {
    width: 84,
  },
  hospitalStaffName: {
    fontFamily: FontFamily.semi_bold,
    fontSize: 12,
    color: Color.dark,
  },
  hospitalStaffHours: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Color.Gray.v400,
    marginTop: 1,
  },
  ganttTrackContainer: {
    flex: 1,
    height: 16,
    backgroundColor: Color.Background.muted,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  ganttTrackGridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  ganttActiveFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: Color.primary + 'cc',
    borderRadius: 3,
  },
  absentGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  hospitalAbsentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.Background.subtle,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    width: '48.5%', 
  },
  hospitalAbsentName: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Color.dark,
  },
  hospitalAbsentBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hospitalAbsentBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 8,
  },
});