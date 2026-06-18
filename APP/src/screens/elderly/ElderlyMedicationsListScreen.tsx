import React, { useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Medication, UserRole } from 'moveplus-shared';
import { MedicationCard } from '@components/MedicationCard';
import { useElderlyDetailsStore } from '@src/stores/elderlyDetailsStore';
import { useAuthStore } from '@src/stores/authStore';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import ScreenState from '@src/constants/screenState';
import { externalAccessApi } from '@src/api/endpoints/externalAccess';
import { asyncStorageService } from '@src/services/AsyncStorageService';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<any, 'ElderlyMedicationsList'>;

const ElderlyMedicationsListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { elderlyId, initialData, isExternalToken } = route.params as any;
  const { elderly, fetchElderly, refreshElderly } = useElderlyDetailsStore();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  // 1. Estado local para as medicações (crucial para o prof. externo)
  const [externalMeds, setExternalMeds] = useState<Medication[]>(initialData || []);
  const [loading, setLoading] = useState(false);

  const state = loading ? ScreenState.LOADING : ScreenState.IDLE;

  const loadMedicationsList = useCallback(async () => {
    if (isExternalToken) {
      setLoading(true);
      const token = await asyncStorageService.getExternalToken();
      if (token) {
        try {
          const res = await externalAccessApi.getProfileByToken(token);
          // Atualiza o estado local para forçar o re-render com dados novos
          setExternalMeds(res.data.elderly.medications as Medication[]);
        } catch (error) {
          console.error("Erro ao refrescar lista externa:", error);
        }
      }
      setLoading(false);
    } else {
      await refreshElderly(elderlyId);
    }
  }, [isExternalToken, elderlyId, refreshElderly]);

  // Carrega lista inicial se for interno
  useEffect(() => {
    if (!initialData && (!elderly || elderly.id !== elderlyId)) {
      fetchElderly(elderlyId);
    }
  }, [elderlyId, initialData]);

  // O useFocusEffect garante que a lista atualiza sempre que voltas ao ecrã
  useFocusEffect(
    useCallback(() => {
      loadMedicationsList();
    }, [loadMedicationsList])
  );

  // 2. Determina qual lista exibir
  const medications = isExternalToken ? externalMeds : (elderly?.medications || []);

  const canAdd = user && [
    UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER,
  ].includes(user.user.role as UserRole);

  useEffect(() => {
    if (canAdd) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.push('AddMedication', { elderlyId })}
            style={styles.headerButton}
          >
            <MaterialIcons name="add" size={22} color={Color.Background.white} />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, canAdd, elderlyId]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('medication.title') });
  }, [navigation, t]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadMedicationsList}
          />
        }
      >
        {medications.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="medication" size={48} color={Color.Gray.v300} />
            <Text style={styles.emptyText}>{t('elderly.noMedications')}</Text>
          </View>
        ) : (
          medications.map((medication: Medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              onPress={() => navigation.navigate('MedicationDetails', { 
                medicationId: medication.id,
                initialData: medications, 
                isExternalToken: isExternalToken,
                token: route.params?.token
              })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default ElderlyMedicationsListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Color.Background.subtle },
  content: { ...spacingStyles.screenScrollContainer, gap: Spacing.xs_4 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl_32, gap: Spacing.sm_8 },
  emptyText: { fontSize: FontSize.bodymedium_16, fontFamily: FontFamily.medium, color: Color.Gray.v400, textAlign: 'center' },
  headerButton: { width: 36, height: 36, borderRadius: Border.sm_8, backgroundColor: Color.Orange.v300, justifyContent: 'center', alignItems: 'center' },
});