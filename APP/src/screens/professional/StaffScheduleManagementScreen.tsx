import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  StaffWorkSchedule, StaffTimeOff, TimeOffType, TimeOffStatus, VacationPolicy,
  UpsertWorkScheduleRequest, CreateTimeOffRequest, UpdateTimeOffRequest, UserRole,
} from 'moveplus-shared';
import { staffScheduleApi } from '@src/api/endpoints/staffSchedule';
import { timeOffApi } from '@src/api/endpoints/timeOff';
import { useAuthStore } from '@src/stores/authStore';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { DatePickerInput } from '@components/DatePickerInput';

type Props = NativeStackScreenProps<any, 'StaffScheduleManagement'>;

const DOW_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DOW_ISO   = [1, 2, 3, 4, 5, 6, 7];

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

function formatShortDate(d: string | Date): string {
  const date = new Date(d);
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function computeUsedVacationDays(timeOffs: StaffTimeOff[], includePending = false, excludeId?: number): number {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  let total = 0;
  for (const to of timeOffs) {
    if (to.id === excludeId) continue;
    if (to.type !== TimeOffType.VACATION) continue;
    if (to.status !== TimeOffStatus.APPROVED && !(includePending && to.status === TimeOffStatus.PENDING)) continue;
    const start = new Date(to.startDate);
    const end = new Date(to.endDate);
    const effectiveStart = start < yearStart ? yearStart : start;
    const effectiveEnd = end > yearEnd ? yearEnd : end;
    if (effectiveStart <= effectiveEnd) {
      const days = Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      total += days;
    }
  }
  return total;
}

const defaultWorkDays = [1, 2, 3, 4, 5];

const StaffScheduleManagementScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userId, staffName } = route.params ?? {};
  const { user } = useAuthStore();
  const { handleError } = useErrorHandler();

  const currentUserId = user?.user?.id;
  const currentRole = user?.user?.role as UserRole;
  const isAdmin = currentRole === UserRole.INSTITUTION_ADMIN || currentRole === UserRole.PROGRAMMER;
  const isAdminViewingOther = isAdmin && userId !== currentUserId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Work schedule state
  const [workSchedule, setWorkSchedule] = useState<StaffWorkSchedule | null>(null);
  const [workDays, setWorkDays] = useState<number[]>(defaultWorkDays);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [scheduleEdited, setScheduleEdited] = useState(false);

  // Time-off state
  const [timeOffs, setTimeOffs] = useState<StaffTimeOff[]>([]);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [editingTimeOff, setEditingTimeOff] = useState<StaffTimeOff | null>(null);
  const [toType, setToType] = useState<TimeOffType>(TimeOffType.VACATION);
  const [toStart, setToStart] = useState<Date>(new Date());
  const [toEnd, setToEnd] = useState<Date>(new Date());
  const [toNote, setToNote] = useState('');

  // Vacation policy state (admin only)
  const [vacationPolicy, setVacationPolicy] = useState<VacationPolicy | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyDays, setPolicyDays] = useState('22');

  const fetchData = useCallback(async () => {
    try {
      const [schedRes, toRes] = await Promise.all([
        staffScheduleApi.getSchedule(userId).catch(() => ({ data: null })),
        timeOffApi.getTimeOffs(userId).catch(() => ({ data: [] as StaffTimeOff[] })),
      ]);
      const sched = schedRes.data;
      if (sched) {
        setWorkSchedule(sched);
        setWorkDays(sched.workDays);
        setStartTime(sched.startTime);
        setEndTime(sched.endTime);
      }
      setTimeOffs(toRes.data ?? []);

      const policyRes = await timeOffApi.getVacationPolicy().catch(() => ({ data: null }));
      if (policyRes.data) {
        setVacationPolicy(policyRes.data);
        setPolicyDays(String(policyRes.data.maxVacationDaysPerYear));
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      setScheduleEdited(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // ── Work schedule handlers ────────────────────────────────────────────────
  const toggleDay = (iso: number) => {
    setWorkDays(prev =>
      prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso].sort((a, b) => a - b)
    );
    setScheduleEdited(true);
  };

  const saveSchedule = async () => {
    const payload: UpsertWorkScheduleRequest = { workDays, startTime, endTime };
    const parsed = UpsertWorkScheduleRequest.safeParse(payload);
    if (!parsed.success) {
      Alert.alert('Erro', 'Formato de hora inválido. Use HH:MM');
      return;
    }
    try {
      setSaving(true);
      await staffScheduleApi.upsertSchedule(userId, payload);
      setScheduleEdited(false);
      Alert.alert('Guardado', 'Horário de trabalho actualizado.');
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Time-off modal handlers ───────────────────────────────────────────────
  const openCreateTimeOff = () => {
    setEditingTimeOff(null);
    setToType(TimeOffType.VACATION);
    setToStart(new Date());
    setToEnd(new Date());
    setToNote('');
    setShowTimeOffModal(true);
  };

  const openEditTimeOff = (to: StaffTimeOff) => {
    setEditingTimeOff(to);
    setToType(to.type);
    setToStart(new Date(to.startDate));
    setToEnd(new Date(to.endDate));
    setToNote(to.note ?? '');
    setShowTimeOffModal(true);
  };

  const saveTimeOff = async () => {
    if (toEnd < toStart) {
      Alert.alert('Erro', 'A data de fim tem de ser igual ou posterior à de início.');
      return;
    }

    // Vacation limit check
    if (toType === TimeOffType.VACATION && maxVacationDays != null) {
      const newDays = Math.round((toEnd.getTime() - toStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const usedAlready = computeUsedVacationDays(timeOffs, true, editingTimeOff?.id);
      if (usedAlready + newDays > maxVacationDays) {
        Alert.alert(
          'Limite de férias excedido',
          `Já tem ${usedAlready} dia(s) de férias registados este ano (aprovados e pendentes). Este pedido de ${newDays} dia(s) excederia o limite de ${maxVacationDays} dias.`,
        );
        return;
      }
    }
    try {
      setSaving(true);
      if (editingTimeOff) {
        const payload: UpdateTimeOffRequest = { type: toType, startDate: toStart, endDate: toEnd, note: toNote || null };
        const updated = await timeOffApi.updateTimeOff(editingTimeOff.id, payload);
        setTimeOffs(prev => prev.map(t => t.id === editingTimeOff.id ? updated.data : t));
      } else {
        const payload: CreateTimeOffRequest = { userId, type: toType, startDate: toStart, endDate: toEnd, note: toNote || null };
        const created = await timeOffApi.createTimeOff(payload);
        setTimeOffs(prev => [...prev, created.data]);
        if (!isAdmin) {
          Alert.alert('Pedido enviado', 'O seu pedido foi enviado para aprovação pelo administrador.');
        }
      }
      setShowTimeOffModal(false);
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteTimeOff = (to: StaffTimeOff) => {
    Alert.alert(
      'Apagar período de ausência',
      `Tem a certeza que quer apagar "${TIME_OFF_LABELS[to.type]}" (${formatShortDate(to.startDate)} – ${formatShortDate(to.endDate)})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar', style: 'destructive', onPress: async () => {
            try {
              await timeOffApi.deleteTimeOff(to.id);
              setTimeOffs(prev => prev.filter(t => t.id !== to.id));
            } catch (err) {
              handleError(err);
            }
          },
        },
      ],
    );
  };

  const approveTimeOff = async (to: StaffTimeOff) => {
    try {
      setSaving(true);
      const updated = await timeOffApi.respondTimeOff(to.id, { status: TimeOffStatus.APPROVED });
      setTimeOffs(prev => prev.map(t => t.id === to.id ? updated.data : t));
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const denyTimeOff = (to: StaffTimeOff) => {
    Alert.alert('Recusar pedido', 'Tem a certeza que quer recusar este pedido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Recusar', style: 'destructive', onPress: async () => {
          try {
            setSaving(true);
            const updated = await timeOffApi.respondTimeOff(to.id, { status: TimeOffStatus.DENIED });
            setTimeOffs(prev => prev.map(t => t.id === to.id ? updated.data : t));
          } catch (err) {
            handleError(err);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const savePolicy = async () => {
    const days = parseInt(policyDays, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      Alert.alert('Erro', 'Insira um valor entre 1 e 365 dias.');
      return;
    }
    try {
      setSaving(true);
      const result = await timeOffApi.upsertVacationPolicy({ maxVacationDaysPerYear: days });
      setVacationPolicy(result.data);
      setShowPolicyModal(false);
      Alert.alert('Guardado', `Máximo de férias definido para ${days} dias por ano.`);
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicatorOverlay />;

  const usedVacationDays = computeUsedVacationDays(timeOffs);
  const maxVacationDays = vacationPolicy?.maxVacationDaysPerYear;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Work Schedule Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={20} color={Color.Cyan.v400} />
            <Text style={styles.sectionTitle}>Horário de trabalho</Text>
          </View>

          {/* Day-of-week toggles */}
          <Text style={styles.fieldLabel}>Dias de trabalho</Text>
          <View style={styles.dowRow}>
            {DOW_ISO.map((iso, i) => {
              const active = workDays.includes(iso);
              return (
                <TouchableOpacity
                  key={iso}
                  style={[styles.dowChip, active && styles.dowChipActive]}
                  onPress={() => isAdmin ? toggleDay(iso) : undefined}
                  activeOpacity={isAdmin ? 0.75 : 1}
                >
                  <Text style={[styles.dowChipText, active && styles.dowChipTextActive]}>
                    {DOW_LABELS[i]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time inputs */}
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>Início</Text>
              <TextInput
                style={styles.timeInput}
                value={startTime}
                onChangeText={isAdmin ? (v => { setStartTime(v); setScheduleEdited(true); }) : undefined}
                editable={isAdmin}
                placeholder="09:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            <MaterialIcons name="arrow-forward" size={18} color={Color.Gray.v400} style={{ marginTop: 28 }} />
            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>Fim</Text>
              <TextInput
                style={styles.timeInput}
                value={endTime}
                onChangeText={isAdmin ? (v => { setEndTime(v); setScheduleEdited(true); }) : undefined}
                editable={isAdmin}
                placeholder="17:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </View>

          {isAdmin && (
            <TouchableOpacity
              style={[styles.saveBtn, !scheduleEdited && styles.saveBtnDisabled]}
              onPress={saveSchedule}
              disabled={!scheduleEdited || saving}
              activeOpacity={0.8}
            >
              <MaterialIcons name="save" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Guardar horário</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Time-off Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="beach-access" size={20} color={Color.Orange.v300} />
            <Text style={styles.sectionTitle}>Férias, folgas e ausências</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openCreateTimeOff} activeOpacity={0.8}>
              <MaterialIcons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Vacation days stats */}
          {maxVacationDays != null && (
            <View style={styles.vacationStatsRow}>
              <MaterialIcons name="event-available" size={16} color={Color.primary} />
              <Text style={styles.vacationStatsText}>
                Férias {new Date().getFullYear()}: <Text style={{ fontFamily: FontFamily.bold }}>{usedVacationDays}</Text> / {maxVacationDays} dias aprovados
              </Text>
            </View>
          )}

          {timeOffs.length === 0 ? (
            <Text style={styles.emptyText}>
              {isAdmin ? 'Nenhuma ausência registada.' : 'Não tem pedidos de ausência.'}
            </Text>
          ) : (
            timeOffs.map(to => {
              const typeColor = TIME_OFF_COLORS[to.type];
              const statusColor = STATUS_COLORS[to.status ?? TimeOffStatus.APPROVED];
              const isPending = to.status === TimeOffStatus.PENDING;
              const canEdit = isAdmin || (isPending && to.userId === currentUserId);
              const canDelete = isAdmin || (isPending && to.userId === currentUserId);

              return (
                <View key={to.id} style={[styles.timeOffRow, { borderLeftColor: typeColor }]}>
                  <View style={styles.timeOffLeft}>
                    <View style={[styles.timeOffBadge, { backgroundColor: typeColor + '22' }]}>
                      <Text style={[styles.timeOffBadgeText, { color: typeColor }]}>{TIME_OFF_LABELS[to.type]}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                        {STATUS_LABELS[to.status ?? TimeOffStatus.APPROVED]}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timeOffDates}>
                    <Text style={styles.timeOffDateText}>
                      {formatShortDate(to.startDate)} – {formatShortDate(to.endDate)}
                    </Text>
                    {!!to.note && <Text style={styles.timeOffNote}>{to.note}</Text>}
                    {!!to.responseNote && (
                      <Text style={[styles.timeOffNote, { color: statusColor }]}>{to.responseNote}</Text>
                    )}
                  </View>
                  <View style={styles.timeOffActions}>
                    {/* Admin viewing another user: show approve/deny for PENDING */}
                    {isAdminViewingOther && isPending ? (
                      <>
                        <TouchableOpacity
                          onPress={() => approveTimeOff(to)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.actionBtn}
                        >
                          <MaterialIcons name="check" size={20} color="#22C55E" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => denyTimeOff(to)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.actionBtn}
                        >
                          <MaterialIcons name="close" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        {canEdit && (
                          <TouchableOpacity onPress={() => openEditTimeOff(to)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <MaterialIcons name="edit" size={18} color={Color.Gray.v400} />
                          </TouchableOpacity>
                        )}
                        {canDelete && (
                          <TouchableOpacity onPress={() => deleteTimeOff(to)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <MaterialIcons name="delete-outline" size={18} color={Color.Error.default} />
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Vacation Policy Section (admin only) ── */}
        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="policy" size={20} color={Color.primary} />
              <Text style={styles.sectionTitle}>Política de Férias</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowPolicyModal(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="edit" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.policyText}>
              Máximo de dias de férias por trabalhador por ano:{' '}
              <Text style={{ fontFamily: FontFamily.bold, color: Color.dark }}>
                {vacationPolicy ? `${vacationPolicy.maxVacationDaysPerYear} dias` : 'Não definido'}
              </Text>
            </Text>
            {!vacationPolicy && (
              <Text style={styles.policyHint}>
                Prima o botão de edição para definir o máximo de dias de férias anuais para todos os trabalhadores deste lar.
              </Text>
            )}
          </View>
        )}

      </ScrollView>

      {/* ── Time-off Modal ── */}
      <Modal visible={showTimeOffModal} transparent animationType="slide" onRequestClose={() => setShowTimeOffModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowTimeOffModal(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{editingTimeOff ? 'Editar pedido' : (isAdmin ? 'Nova ausência' : 'Pedir ausência')}</Text>

          {/* Type selector */}
          <Text style={styles.fieldLabel}>Tipo</Text>
          <View style={styles.typeRow}>
            {Object.values(TimeOffType).map(t => {
              const active = toType === t;
              const color = TIME_OFF_COLORS[t];
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, active && { backgroundColor: color + '22', borderColor: color }]}
                  onPress={() => setToType(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeChipText, active && { color }]}>{TIME_OFF_LABELS[t]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date pickers */}
          <Text style={styles.fieldLabel}>Data de início</Text>
          <DatePickerInput
            value={toStart}
            onChange={d => setToStart(d)}
            label=""
          />
          <Text style={[styles.fieldLabel, { marginTop: Spacing.sm_8 }]}>Data de fim</Text>
          <DatePickerInput
            value={toEnd}
            onChange={d => setToEnd(d)}
            label=""
          />

          {/* Note */}
          <Text style={[styles.fieldLabel, { marginTop: Spacing.sm_8 }]}>Nota (opcional)</Text>
          <TextInput
            style={styles.noteInput}
            value={toNote}
            onChangeText={setToNote}
            placeholder="Ex: Férias de Verão"
            multiline
            numberOfLines={2}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={saveTimeOff} disabled={saving} activeOpacity={0.85}>
            <MaterialIcons name="save" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{editingTimeOff ? 'Guardar alterações' : (isAdmin ? 'Criar ausência' : 'Enviar pedido')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Vacation Policy Modal ── */}
      <Modal visible={showPolicyModal} transparent animationType="slide" onRequestClose={() => setShowPolicyModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowPolicyModal(false)} />
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
          />
          <TouchableOpacity style={styles.saveBtn} onPress={savePolicy} disabled={saving} activeOpacity={0.85}>
            <MaterialIcons name="save" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Guardar política</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {saving && <ActivityIndicatorOverlay />}
    </SafeAreaView>
  );
};

export default StaffScheduleManagementScreen;

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.muted,
  },
  content: {
    padding: Spacing.md_16,
    gap: Spacing.md_16,
    paddingBottom: Spacing.xl2_40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: Spacing.md_16,
    gap: Spacing.sm_10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
    marginBottom: 2,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.dark,
  },
  fieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
    marginBottom: 2,
  },
  dowRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  dowChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Color.Gray.v200,
    backgroundColor: Color.Background.subtle,
  },
  dowChipActive: {
    borderColor: Color.Cyan.v300,
    backgroundColor: Color.Cyan.v100,
  },
  dowChipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
  },
  dowChipTextActive: {
    color: Color.Cyan.v500,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.sm_12,
    alignItems: 'center',
  },
  timeField: {
    flex: 1,
  },
  timeInput: {
    borderWidth: 1.5,
    borderColor: Color.Gray.v200,
    borderRadius: 10,
    paddingHorizontal: Spacing.sm_12,
    paddingVertical: Spacing.sm_10,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
    backgroundColor: Color.Background.subtle,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Color.primary,
    borderRadius: 12,
    paddingVertical: Spacing.sm_12,
    marginTop: 4,
  },
  saveBtnDisabled: {
    backgroundColor: Color.Gray.v300,
  },
  saveBtnText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: '#fff',
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
    textAlign: 'center',
    paddingVertical: Spacing.sm_8,
  },
  timeOffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
    borderLeftWidth: 3,
    borderRadius: 8,
    backgroundColor: Color.Background.subtle,
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.sm_10,
  },
  timeOffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  timeOffBadgeText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
  },
  timeOffDates: {
    flex: 1,
  },
  timeOffDateText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.dark,
  },
  timeOffNote: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Color.Gray.v400,
    marginTop: 1,
  },
  // Modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.md_16,
    paddingBottom: 34,
    gap: Spacing.sm_8,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Color.Gray.v200,
    marginBottom: Spacing.sm_8,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.dark,
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Color.Gray.v200,
    backgroundColor: Color.Background.subtle,
  },
  typeChipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
  },
  noteInput: {
    borderWidth: 1.5,
    borderColor: Color.Gray.v200,
    borderRadius: 10,
    padding: Spacing.sm_10,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  timeOffLeft: {
    flexDirection: 'column',
    gap: 4,
    flexShrink: 0,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: 10,
  },
  timeOffActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexShrink: 0,
  },
  actionBtn: {
    padding: 4,
  },
  vacationStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Color.Background.subtle,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  vacationStatsText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v500,
  },
  policyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
  },
  policyHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
    fontStyle: 'italic',
  },
});
