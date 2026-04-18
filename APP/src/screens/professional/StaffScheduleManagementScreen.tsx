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
  StaffWorkSchedule, StaffTimeOff, TimeOffType,
  UpsertWorkScheduleRequest, CreateTimeOffRequest, UpdateTimeOffRequest,
} from 'moveplus-shared';
import { staffScheduleApi } from '@src/api/endpoints/staffSchedule';
import { timeOffApi } from '@src/api/endpoints/timeOff';
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

function formatShortDate(d: string | Date): string {
  const date = new Date(d);
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const defaultWorkDays = [1, 2, 3, 4, 5];

const StaffScheduleManagementScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userId, staffName } = route.params ?? {};
  const { handleError } = useErrorHandler();

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

  if (loading) return <ActivityIndicatorOverlay />;

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
                  onPress={() => toggleDay(iso)}
                  activeOpacity={0.75}
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
                onChangeText={v => { setStartTime(v); setScheduleEdited(true); }}
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
                onChangeText={v => { setEndTime(v); setScheduleEdited(true); }}
                placeholder="17:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, !scheduleEdited && styles.saveBtnDisabled]}
            onPress={saveSchedule}
            disabled={!scheduleEdited || saving}
            activeOpacity={0.8}
          >
            <MaterialIcons name="save" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Guardar horário</Text>
          </TouchableOpacity>
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

          {timeOffs.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma ausência registada.</Text>
          ) : (
            timeOffs.map(to => {
              const color = TIME_OFF_COLORS[to.type];
              return (
                <View key={to.id} style={[styles.timeOffRow, { borderLeftColor: color }]}>
                  <View style={[styles.timeOffBadge, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.timeOffBadgeText, { color }]}>{TIME_OFF_LABELS[to.type]}</Text>
                  </View>
                  <View style={styles.timeOffDates}>
                    <Text style={styles.timeOffDateText}>
                      {formatShortDate(to.startDate)} – {formatShortDate(to.endDate)}
                    </Text>
                    {!!to.note && <Text style={styles.timeOffNote}>{to.note}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => openEditTimeOff(to)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="edit" size={18} color={Color.Gray.v400} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteTimeOff(to)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="delete-outline" size={18} color={Color.Error.default} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* ── Time-off Modal ── */}
      <Modal visible={showTimeOffModal} transparent animationType="slide" onRequestClose={() => setShowTimeOffModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowTimeOffModal(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{editingTimeOff ? 'Editar ausência' : 'Nova ausência'}</Text>

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
            <Text style={styles.saveBtnText}>{editingTimeOff ? 'Guardar alterações' : 'Criar ausência'}</Text>
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
});
