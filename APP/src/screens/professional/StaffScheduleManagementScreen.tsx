import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput, Switch, KeyboardAvoidingView, Platform,
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

const DOW_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
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

interface LocalSlot {
  dayIso: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// CÁLCULO INTELIGENTE DAS FÉRIAS BASEADO NOS NOVOS SLOTS DO FUNCIONÁRIO
function computeUsedVacationDays(timeOffs: StaffTimeOff[], slots: LocalSlot[], includePending = false, excludeId?: number): number {
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

    let current = new Date(effectiveStart);
    while (current <= effectiveEnd) {
      const jsDay = current.getDay();
      const isoDay = jsDay === 0 ? 7 : jsDay;

      // REGRA: Só gasta dia de férias se o dia da semana estiver marcado como ativo (trabalho) nos slots
      const matchingSlot = slots.find(s => s.dayIso === isoDay);
      if (matchingSlot && matchingSlot.isActive) {
        total += 1;
      }
      current.setDate(current.getDate() + 1);
    }
  }
  return total;
}

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

  // 🔥 NOVO ESTADO: Armazena a matriz completa de slots de 7 dias com horários independentes
  const [slots, setSlots] = useState<LocalSlot[]>(
    DOW_ISO.map(iso => ({ dayIso: iso, startTime: '09:00', endTime: '17:00', isActive: iso <= 5 }))
  );
  const [scheduleEdited, setScheduleEdited] = useState(false);

  const [timeOffs, setTimeOffs] = useState<StaffTimeOff[]>([]);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [editingTimeOff, setEditingTimeOff] = useState<StaffTimeOff | null>(null);
  const [toType, setToType] = useState<TimeOffType>(TimeOffType.VACATION);
  const [toStart, setToStart] = useState<Date>(new Date());
  const [toEnd, setToEnd] = useState<Date>(new Date());
  const [toNote, setToNote] = useState('');

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
      if (sched && sched.slots && sched.slots.length > 0) {
        // Popula os slots com as configurações vindas do banco de dados
        const fullSlots = DOW_ISO.map(iso => {
          const found = sched.slots.find((s: any) => s.dayIso === iso);
          return found 
            ? { dayIso: iso, startTime: found.startTime, endTime: found.endTime, isActive: found.isActive }
            : { dayIso: iso, startTime: '09:00', endTime: '17:00', isActive: false };
        });
        setSlots(fullSlots);
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

  // ── Handlers do Horário por Dia ──────────────────────────────────────────
  const handleToggleDay = (dayIso: number) => {
    setSlots(prev => prev.map(s => s.dayIso === dayIso ? { ...s, isActive: !s.isActive } : s));
    setScheduleEdited(true);
  };

  const handleTimeChange = (dayIso: number, field: 'startTime' | 'endTime', value: string) => {
    setSlots(prev => prev.map(s => s.dayIso === dayIso ? { ...s, [field]: value } : s));
    setScheduleEdited(true);
  };

  const saveSchedule = async () => {
    // Valida o formato de horas HH:MM de todos os dias que estão marcados como ativos
    const activeSlots = slots.filter(s => s.isActive);
    const hourRegex = /^\d{2}:\d{2}$/;
    for (const slot of activeSlots) {
      if (!hourRegex.test(slot.startTime) || !hourRegex.test(slot.endTime)) {
        Alert.alert('Erro', `Formato de hora inválido no dia ${DOW_LABELS[slot.dayIso - 1]}. Use HH:MM`);
        return;
      }
    }

    const payload: UpsertWorkScheduleRequest = { slots };
    try {
      setSaving(true);
      await staffScheduleApi.upsertSchedule(userId, payload);
      setScheduleEdited(false);
      Alert.alert('Guardado', 'Horário de trabalho por dia actualizado.');
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Handlers de Ausências ──────────────────────────────────────────────────
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

    if (toType === TimeOffType.VACATION && maxVacationDays != null) {
      const usedAlready = computeUsedVacationDays(timeOffs, slots, true, editingTimeOff?.id);
      
      let newDays = 0;
      let current = new Date(toStart);
      while (current <= toEnd) {
        const jsDay = current.getDay();
        const isoDay = jsDay === 0 ? 7 : jsDay;
        const targetSlot = slots.find(s => s.dayIso === isoDay);
        if (targetSlot && targetSlot.isActive) {
          newDays += 1;
        }
        current.setDate(current.getDate() + 1);
      }

      if (usedAlready + newDays > maxVacationDays) {
        Alert.alert(
          'Limite de férias excedido',
          `Já tem ${usedAlready} dia(s) úteis registados este ano. Este pedido de ${newDays} dia(s) efetivo(s) excederia o limite de ${maxVacationDays} dias.`,
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

  const usedVacationDays = computeUsedVacationDays(timeOffs, slots);
  const maxVacationDays = vacationPolicy?.maxVacationDaysPerYear;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Work Schedule Section (Mapeamento de Linhas Individuais por Dia) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={20} color={Color.Cyan.v400} />
            <Text style={styles.sectionTitle}>Horário de trabalho semanal</Text>
          </View>

          <Text style={[styles.fieldLabel, { marginBottom: Spacing.sm_8 }]}>Configure as horas de cada dia útil:</Text>
          
          {slots.map((slot) => {
            const index = slot.dayIso - 1;
            return (
              <View key={slot.dayIso} style={[styles.slotRow, !slot.isActive && styles.slotRowDisabled]}>
                <View style={styles.slotLeftInfo}>
                  <Switch
                    value={slot.isActive}
                    onValueChange={() => isAdmin ? handleToggleDay(slot.dayIso) : undefined}
                    disabled={!isAdmin}
                    trackColor={{ true: Color.Cyan.v300, false: Color.Gray.v200 }}
                    thumbColor={slot.isActive ? Color.Cyan.v500 : Color.Gray.v400}
                  />
                  <Text style={[styles.slotDayLabel, slot.isActive && styles.slotDayLabelActive]}>
                    {DOW_LABELS[index]}
                  </Text>
                </View>

                {slot.isActive ? (
                  <View style={styles.slotInputsContainer}>
                    <TextInput
                      style={styles.slotTimeInput}
                      value={slot.startTime}
                      onChangeText={(v) => handleTimeChange(slot.dayIso, 'startTime', v)}
                      editable={isAdmin}
                      placeholder="09:00"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                    <Text style={styles.slotTimeSeparator}>-</Text>
                    <TextInput
                      style={styles.slotTimeInput}
                      value={slot.endTime}
                      onChangeText={(v) => handleTimeChange(slot.dayIso, 'endTime', v)}
                      editable={isAdmin}
                      placeholder="17:00"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                  </View>
                ) : (
                  <Text style={styles.slotOffText}>Folga / Inactivo</Text>
                )}
              </View>
            );
          })}

          {isAdmin && (
            <TouchableOpacity
              style={[styles.saveBtn, !scheduleEdited && styles.saveBtnDisabled]}
              onPress={saveSchedule}
              disabled={!scheduleEdited || saving}
              activeOpacity={0.8}
            >
              <MaterialIcons name="save" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Guardar escala semanal</Text>
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ justifyContent: 'flex-end' }}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editingTimeOff ? 'Editar pedido' : (isAdmin ? 'Nova ausência' : 'Pedir ausência')}</Text>

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

              <Text style={[styles.fieldLabel, { marginTop: Spacing.sm_8 }]}>Data de início</Text>
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

              <Text style={[styles.fieldLabel, { marginTop: Spacing.sm_8 }]}>Nota (opcional)</Text>
              <TextInput
                style={styles.noteInput}
                value={toNote}
                onChangeText={setToNote}
                placeholder="Ex: Férias de Verão"
                multiline
                numberOfLines={3}
                returnKeyType="done"
                blurOnSubmit
              />

              <TouchableOpacity style={[styles.saveBtn, { marginTop: Spacing.sm_12, marginBottom: Spacing.sm_8 }]} onPress={saveTimeOff} disabled={saving} activeOpacity={0.85}>
                <MaterialIcons name="save" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>{editingTimeOff ? 'Guardar alterações' : (isAdmin ? 'Criar ausência' : 'Enviar pedido')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Custom Pop-up da Política de Férias (Sem usar Modal para evitar bugs no iPhone) ── */}
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
                activeOpacity={0.85}
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

export default StaffScheduleManagementScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Color.Background.muted },
  content: { padding: Spacing.md_16, gap: Spacing.md_16, paddingBottom: Spacing.xl2_40 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: Spacing.md_16, gap: Spacing.sm_10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm_8, marginBottom: 2 },
  sectionTitle: { flex: 1, fontFamily: FontFamily.bold, fontSize: FontSize.bodylarge_18, color: Color.dark },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.Gray.v400, marginBottom: 2 },
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
  
  // ESTILOS NOVOS PARA OS SLOTS DIÁRIOS ALINHADOS
  slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Color.Gray.v100 },
  slotRowDisabled: { opacity: 0.65 },
  slotLeftInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  slotDayLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: Color.Gray.v400 },
  slotDayLabelActive: { fontFamily: FontFamily.semi_bold, color: Color.dark },
  slotInputsContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotTimeInput: { borderWidth: 1.5, borderColor: Color.Gray.v200, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, width: 64, textAlign: 'center', fontFamily: FontFamily.medium, fontSize: 13, color: Color.dark, backgroundColor: Color.Background.subtle },
  slotTimeSeparator: { fontSize: 14, color: Color.Gray.v400, fontFamily: FontFamily.medium },
  slotOffText: { fontFamily: FontFamily.regular, fontSize: FontSize.caption_12, color: Color.Gray.v400, fontStyle: 'italic', paddingRight: 10 },
  
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Color.primary, borderRadius: 12, paddingVertical: Spacing.sm_12, marginTop: 12 },
  saveBtnDisabled: { backgroundColor: Color.Gray.v300 },
  saveBtnText: { fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodysmall_14, color: '#fff' },
  addBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: Color.primary, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: FontFamily.regular, fontSize: FontSize.caption_12, color: Color.Gray.v400, textAlign: 'center', paddingVertical: Spacing.sm_8 },
  timeOffRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm_8, borderLeftWidth: 3, borderRadius: 8, backgroundColor: Color.Background.subtle, paddingVertical: Spacing.sm_8, paddingHorizontal: Spacing.sm_10 },
  timeOffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexShrink: 0 },
  timeOffBadgeText: { fontFamily: FontFamily.semi_bold, fontSize: FontSize.caption_12 },
  timeOffDates: { flex: 1 },
  timeOffDateText: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.dark },
  timeOffNote: { fontFamily: FontFamily.regular, fontSize: 11, color: Color.Gray.v400, marginTop: 1 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.md_16, paddingBottom: 34, gap: Spacing.sm_8 },
  modalHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Color.Gray.v200, marginBottom: Spacing.sm_8 },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.bodylarge_18, color: Color.dark, marginBottom: 4 },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: Color.Gray.v200, backgroundColor: Color.Background.subtle },
  typeChipText: { fontFamily: FontFamily.medium, fontSize: FontSize.caption_12, color: Color.Gray.v400 },
  noteInput: { borderWidth: 1.5, borderColor: Color.Gray.v200, borderRadius: 10, padding: Spacing.sm_10, fontFamily: FontFamily.regular, fontSize: FontSize.bodysmall_14, color: Color.dark, minHeight: 60, textAlignVertical: 'top' },
  timeOffLeft: { flexDirection: 'column', gap: 4, flexShrink: 0 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, flexShrink: 0 },
  statusBadgeText: { fontFamily: FontFamily.semi_bold, fontSize: 10 },
  timeOffActions: { flexDirection: 'row', gap: 6, alignItems: 'center', flexShrink: 0 },
  actionBtn: { padding: 4 },
  vacationStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Color.Background.subtle, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  vacationStatsText: { fontFamily: FontFamily.regular, fontSize: FontSize.caption_12, color: Color.Gray.v500 },
  policyText: { fontFamily: FontFamily.regular, fontSize: FontSize.bodysmall_14, color: Color.Gray.v500 },
  policyHint: { fontFamily: FontFamily.regular, fontSize: FontSize.caption_12, color: Color.Gray.v400, fontStyle: 'italic' },
  popupOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 999, justifyContent: 'center', alignItems: 'center' },
  popupBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  popupKeyboardAvoiding: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  popupAlertBox: { width: '85%', maxWidth: 320, backgroundColor: '#fff', borderRadius: 16, padding: Spacing.md_16, gap: Spacing.sm_8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
});