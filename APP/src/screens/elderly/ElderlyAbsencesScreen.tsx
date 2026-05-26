import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ElderlyAbsence, UserRole } from 'moveplus-shared';
import { elderlyAbsenceApi } from '@src/api/endpoints/elderlyAbsence';
import { useAuthStore } from '@src/stores/authStore';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { DatePickerInput } from '@components/DatePickerInput';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useErrorHandler } from '@src/hooks/useErrorHandler';

interface Props {
  route: any;
  navigation: any;
}

const ElderlyAbsencesScreen: React.FC<Props> = ({ route, navigation }) => {
  const { elderlyId, elderlyName } = route.params ?? {};
  const { user } = useAuthStore();
  const { handleError } = useErrorHandler();
  const userRole = user?.user?.role;
  const canEdit = [UserRole.INSTITUTION_ADMIN, UserRole.CAREGIVER, UserRole.PROGRAMMER].includes(userRole as UserRole);

  const [absences, setAbsences] = useState<ElderlyAbsence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add modal state
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAbsences = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await elderlyAbsenceApi.getAbsences(elderlyId);
      setAbsences(res.data ?? []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderlyId]);

  useFocusEffect(useCallback(() => { fetchAbsences(); }, [fetchAbsences]));

  const openModal = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
    setReason('');
    setShowModal(true);
  };

  const saveAbsence = async () => {
    if (endDate < startDate) {
      Alert.alert('Erro', 'A data de fim tem de ser igual ou posterior à data de início.');
      return;
    }
    try {
      setSaving(true);
      const res = await elderlyAbsenceApi.createAbsence(elderlyId, {
        startDate,
        endDate,
        reason: reason.trim() || null,
      });
      setAbsences(prev => [...prev, res.data]);
      setShowModal(false);
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (absence: ElderlyAbsence) => {
    const fmt = (d: string | Date) => new Date(d).toLocaleDateString('pt-PT');
    Alert.alert(
      'Apagar ausência',
      `Apagar ausência de ${fmt(absence.startDate)} a ${fmt(absence.endDate)}?`,
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
      ]
    );
  };

  const fmt = (d: string | Date) => new Date(d).toLocaleDateString('pt-PT');

  if (loading) return <ActivityIndicatorOverlay />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAbsences(true); }} />}
      >
        {absences.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="person-off" size={48} color={Color.Gray.v300} />
            <Text style={styles.emptyTitle}>Sem ausências registadas</Text>
            <Text style={styles.emptySubtitle}>Nenhuma ausência foi registada para este utente.</Text>
          </View>
        ) : (
          absences
            .slice()
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .map(absence => {
              const sameDay = fmt(absence.startDate) === fmt(absence.endDate);
              const dateLabel = sameDay
                ? fmt(absence.startDate)
                : `${fmt(absence.startDate)} – ${fmt(absence.endDate)}`;
              const now = new Date();
              const end = new Date(absence.endDate);
              const isActive = end >= now;

              return (
                <View key={absence.id} style={styles.card}>
                  <View style={[styles.statusBar, { backgroundColor: isActive ? Color.primary : Color.Gray.v300 }]} />
                  <View style={styles.cardContent}>
                    <View style={styles.cardRow}>
                      <MaterialIcons name="person-off" size={18} color={isActive ? Color.primary : Color.Gray.v400} />
                      <Text style={styles.dateText}>{dateLabel}</Text>
                      {isActive && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Ativa</Text>
                        </View>
                      )}
                    </View>
                    {absence.reason ? (
                      <Text style={styles.reasonText}>{absence.reason}</Text>
                    ) : null}
                    <Text style={styles.createdByText}>
                      Registado por {(absence as any).createdBy?.name ?? '—'}
                    </Text>
                  </View>
                  {canEdit && (
                    <TouchableOpacity onPress={() => confirmDelete(absence)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialIcons name="delete-outline" size={20} color={Color.Error.default} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
        )}
      </ScrollView>

      {canEdit && (
        <TouchableOpacity style={styles.fab} onPress={openModal} activeOpacity={0.85}>
          <MaterialIcons name="add" size={26} color={Color.white} />
        </TouchableOpacity>
      )}

      {/* Add absence modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={styles.overlayContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowModal(false)} />
          <TouchableOpacity activeOpacity={1} style={styles.modalBox}>
            <Text style={styles.modalTitle}>Registar Ausência</Text>

            <View style={styles.fieldGap}>
              <DatePickerInput
                label="Data de início"
                value={startDate}
                onChange={d => { setStartDate(d); if (d > endDate) setEndDate(d); }}
              />
            </View>

            <View style={styles.fieldGap}>
              <DatePickerInput
                label="Data de fim"
                value={endDate}
                onChange={setEndDate}
                minimumDate={startDate}
              />
            </View>

            <View style={styles.fieldGap}>
              <TextInput
                style={styles.reasonInput}
                placeholder="Motivo (opcional)"
                placeholderTextColor={Color.Gray.v400}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveAbsence} disabled={saving} style={[styles.saveBtn, saving && styles.saveBtnDisabled]}>
                <Text style={styles.saveBtnText}>{saving ? 'A guardar…' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default ElderlyAbsencesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  content: {
    padding: Spacing.md_16,
    paddingBottom: 90,
    gap: Spacing.sm_12,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.sm_8,
  },
  emptyTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.Gray.v500,
    marginTop: Spacing.sm_8,
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg_24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  statusBar: {
    width: 4,
    backgroundColor: Color.primary,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md_16,
    gap: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
  },
  dateText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: `${Color.primary}20`,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Color.primary,
  },
  reasonText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
    marginTop: 2,
  },
  createdByText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Color.Gray.v400,
    marginTop: 4,
  },
  deleteBtn: {
    padding: Spacing.md_16,
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg_24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: Color.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '90%',
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    padding: Spacing.lg_24,
    gap: Spacing.md_16,
  },
  modalTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.subtitle_20,
    color: Color.dark,
    textAlign: 'center',
    marginBottom: Spacing.sm_8,
  },
  fieldGap: {
    gap: Spacing.sm_8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_12,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md_16,
    marginTop: Spacing.sm_8,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.md_16,
  },
  cancelBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  saveBtn: {
    backgroundColor: Color.primary,
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.lg_24,
    borderRadius: Border.sm_8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.white,
  },
});
