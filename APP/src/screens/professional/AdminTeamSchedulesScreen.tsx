import React, { useState, useCallback } from 'react';
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
  return d.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function isDateInRange(date: Date, startStr: string, endStr: string): boolean {
  const d = date.getTime();
  const start = new Date(startStr).setHours(0, 0, 0, 0);
  const end = new Date(endStr).setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}

function isStaffPresent(s: StaffScheduleSummary, date: Date): 'present' | 'absent' | 'no-schedule' {
  const hasTimeOff = s.timeOffs.some(t =>
    isDateInRange(date, t.startDate as string, t.endDate as string)
  );
  if (hasTimeOff) return 'absent';
  if (!s.schedule) return 'no-schedule';
  const jsDay = date.getDay();
  const isoDay = jsDay === 0 ? 7 : jsDay;
  return s.schedule.workDays.includes(isoDay) ? 'present' : 'absent';
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

        {/* ── Daily Presence Calendar ── */}
        {institutionSchedules.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="today" size={20} color={Color.primary} />
              <Text style={styles.sectionTitle}>Presença por Dia</Text>
            </View>
            <View style={styles.presenceNav}>
              <TouchableOpacity
                style={styles.presenceNavBtn}
                onPress={() => setPresenceDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="chevron-left" size={24} color={Color.primary} />
              </TouchableOpacity>
              <Text style={styles.presenceDateText}>{formatPresenceDate(presenceDate)}</Text>
              <TouchableOpacity
                style={styles.presenceNavBtn}
                onPress={() => setPresenceDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="chevron-right" size={24} color={Color.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presenceTodayBtn}
                onPress={() => setPresenceDate(new Date())}
              >
                <Text style={styles.presenceTodayText}>Hoje</Text>
              </TouchableOpacity>
            </View>
            {institutionSchedules.map(s => {
              const status = isStaffPresent(s, presenceDate);
              const color = status === 'present' ? '#22C55E' : status === 'absent' ? '#EF4444' : '#94A3B8';
              const icon = status === 'present' ? 'check-circle' : status === 'absent' ? 'cancel' : 'help-outline';
              const label = status === 'present' ? 'Presente' : status === 'absent' ? 'Ausente' : 'Sem horário';
              return (
                <View key={s.userId} style={styles.presenceMemberRow}>
                  <MaterialIcons name={icon as any} size={20} color={color} />
                  <Text style={styles.presenceMemberName}>{s.name}</Text>
                  <View style={[styles.presenceStatusBadge, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.presenceStatusText, { color }]}>{label}</Text>
                  </View>
                </View>
              );
            })}
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

      {/* ── Policy Modal ── */}
      <Modal visible={showPolicyModal} transparent animationType="slide" onRequestClose={() => setShowPolicyModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowPolicyModal(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ justifyContent: 'flex-end' }}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
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
            <TouchableOpacity style={[styles.saveBtn, { marginTop: 4 }]} onPress={savePolicy} disabled={saving}>
              <MaterialIcons name="save" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Guardar política</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  // Modal shared styles
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
  presenceNav: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  presenceNavBtn: { padding: 4 },
  presenceDateText: {
    flex: 1, textAlign: 'center',
    fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodysmall_14, color: Color.dark,
  },
  presenceTodayBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, backgroundColor: Color.primary + '18',
  },
  presenceTodayText: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.primary },
  presenceMemberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Color.Gray.v100,
  },
  presenceMemberName: {
    flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.dark,
  },
  presenceStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  presenceStatusText: { fontFamily: FontFamily.semi_bold, fontSize: 11 },
});
