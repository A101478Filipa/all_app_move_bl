import React, { useState } from 'react';
import {
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useElderlyDetailsStore } from '@src/stores';
import { UpdateMedicationRequest, Medication, MedicationStatus } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { VStack } from '@components/CoreComponents';
import { PrimaryButton } from '@components/ButtonComponents';
import { FormTextInput } from '@components/forms/FormTextInput';
import { FormDateInput } from '@components/forms/FormDateInput';
import { FormDropdown } from '@components/forms/FormDropdown';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from 'react-i18next';
import { Border } from '@styles/borders';
import { shadowStyles } from '@styles/shadow';

type EditMedicationScreenProps = NativeStackScreenProps<any, 'EditMedication'>;

interface EditMedicationScreenRouteParams {
  medication: Medication;
  elderlyId: number;
}

type MedicationForm = {
  dosage: string | null;
  frequency: string | null;
  administration: string | null;
  endDate: string | null;
  status: MedicationStatus | null;
  notes: string | null;
};

const EditMedicationScreen: React.FC<EditMedicationScreenProps> = ({ route, navigation }) => {
  const { medication, elderlyId } = route.params;
  const [loading, setLoading] = useState(false);
  const { updateMedication } = useElderlyDetailsStore();
  const { handleError, handleSuccess, handleValidationError } = useErrorHandler();
  const { t } = useTranslation();

  const [form, setForm] = useState<MedicationForm>({
    dosage: medication.dosage || null,
    frequency: medication.frequency || null,
    administration: medication.administration || null,
    endDate: medication.endDate || null,
    status: medication.status || MedicationStatus.ACTIVE,
    notes: medication.notes || null,
  });

  const statusOptions = [
    { label: t('medication.statusOptions.active'), value: MedicationStatus.ACTIVE },
    { label: t('medication.statusOptions.inactive'), value: MedicationStatus.INACTIVE },
    { label: t('medication.statusOptions.paused'), value: MedicationStatus.PAUSED },
    { label: t('medication.statusOptions.discontinued'), value: MedicationStatus.DISCONTINUED },
    { label: t('medication.statusOptions.completed'), value: MedicationStatus.COMPLETED },
  ];

  const handleInputChange = (field: keyof MedicationForm, value: string | MedicationStatus) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const medicationData: UpdateMedicationRequest = {
        dosage: form.dosage || undefined,
        frequency: form.frequency || undefined,
        administration: form.administration || undefined,
        endDate: form.endDate ? new Date(form.endDate) : undefined,
        status: form.status || undefined,
        notes: form.notes || undefined,
      };

      await updateMedication(elderlyId, medication.id, medicationData);

      handleSuccess(t('medication.medicationUpdatedSuccessfully'));
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update medication:', error);
      handleError(error, t('medication.failedToUpdateMedication'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
      keyboardDismissMode='on-drag'
    >
      <VStack align="flex-start" spacing={Spacing.md_16}>
        {/* Read-only information */}
        <VStack align="flex-start" spacing={Spacing.sm_8} style={styles.readOnlySection}>
          <Text style={styles.readOnlyLabel}>{t('medication.medicationInformation')}</Text>
          <Text style={styles.readOnlyText}>{t('medication.medicationName')}: {medication.name}</Text>
          {medication.activeIngredient && (
            <Text style={styles.readOnlyText}>{t('medication.activeIngredient')}: {medication.activeIngredient}</Text>
          )}
          {medication.startDate && (
            <Text style={styles.readOnlyText}>{t('medication.startDate')}: {new Date(medication.startDate).toLocaleDateString()}</Text>
          )}
        </VStack>

        <FormTextInput
          title={t('medication.dosage')}
          placeholder={t('medication.dosagePlaceholder')}
          value={form.dosage || ''}
          onChangeText={(value) => handleInputChange('dosage', value)}
        />

        <FormTextInput
          title={t('medication.frequency')}
          placeholder={t('medication.frequencyPlaceholder')}
          value={form.frequency || ''}
          onChangeText={(value) => handleInputChange('frequency', value)}
        />

        <FormTextInput
          title={t('medication.administrationRoute')}
          placeholder={t('medication.administrationPlaceholder')}
          value={form.administration || ''}
          onChangeText={(value) => handleInputChange('administration', value)}
        />

        <FormDropdown
          title={t('medication.status')}
          placeholder={t('medication.selectStatus')}
          value={form.status}
          onValueChange={(value) => handleInputChange('status', value as MedicationStatus)}
          options={statusOptions}
        />

        <FormDateInput
          title={t('medication.endDate')}
          placeholder={t('medication.selectEndDate')}
          value={form.endDate}
          onDateChange={(date) => handleInputChange('endDate', date)}
          minimumDate={medication.startDate ? new Date(medication.startDate) : new Date()}
        />

        <FormTextInput
          title={t('medication.notes')}
          placeholder={t('medication.additionalNotesPlaceholder')}
          value={form.notes || ''}
          onChangeText={(value) => handleInputChange('notes', value)}
          multiline
        />

        <PrimaryButton
          title={loading ? t('medication.updating') : t('medication.updateMedication')}
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </VStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  contentContainer: {
    ...spacingStyles.screenScrollContainer,
  },
  title: {
    fontSize: FontSize.heading1_32,
    fontFamily: FontFamily.bold,
    color: Color.dark,
    textAlign: 'center',
    marginBottom: Spacing.md_16,
  },
  readOnlySection: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.sm_8,
    padding: Spacing.md_16,
    marginBottom: Spacing.sm_8,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow
  },
  readOnlyLabel: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    marginBottom: Spacing.xs_4,
  },
  readOnlyText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    marginBottom: Spacing.xxs_2,
  },
  submitButton: {
    marginTop: Spacing.lg_24,
  },
});

export default EditMedicationScreen;