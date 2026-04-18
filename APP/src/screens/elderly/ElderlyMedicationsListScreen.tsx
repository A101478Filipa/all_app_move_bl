import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Medication, UserRole } from 'moveplus-shared';
import { MedicationCard } from '@components/MedicationCard';
import { useElderlyDetailsStore } from '@src/stores/elderlyDetailsStore';
import { useAuthStore } from '@src/stores/authStore';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import ScreenState from '@src/constants/screenState';

type Props = NativeStackScreenProps<any, 'ElderlyMedicationsList'>;

const ElderlyMedicationsListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { elderlyId } = route.params;
  const { t } = useTranslation();
  const { elderly, state, refreshElderly } = useElderlyDetailsStore();
  const { user } = useAuthStore();

  const canAdd = user && [
    UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER,
  ].includes(user.user.role as UserRole);

  useEffect(() => {
    if (canAdd) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.push('AddMedication', { elderlyId })}
            style={{ padding: Spacing.xs_4, marginRight: Spacing.xs_4 }}
          >
            <MaterialIcons name="add" size={24} color={Color.primary} />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, canAdd, elderlyId]);

  const medications: Medication[] = elderly?.medications ?? [];

  const handleMedicationPress = (medication: Medication) => {
    navigation.push('MedicationDetails', { medicationId: medication.id });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state === ScreenState.REFRESHING}
            onRefresh={() => refreshElderly(elderlyId)}
          />
        }
      >
        {medications.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="medication" size={48} color={Color.Gray.v300} />
            <Text style={styles.emptyText}>{t('elderly.noMedications')}</Text>
          </View>
        ) : (
          medications.map(medication => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              onPress={handleMedicationPress}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default ElderlyMedicationsListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  content: {
    ...spacingStyles.screenScrollContainer,
    gap: Spacing.xs_4,
  },
  emptyState: {
    flex: 1,
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
});
