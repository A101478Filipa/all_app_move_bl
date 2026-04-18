import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useElderlyDetailsStore } from '@src/stores';
import { CreateMedicationRequest, MedicationStatus } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { VStack } from '@components/CoreComponents';
import { PrimaryButton } from '@components/ButtonComponents';
import { FormTextInput } from '@components/forms/FormTextInput';
import { FormDateInput } from '@components/forms/FormDateInput';
import { FormDropdown } from '@components/forms/FormDropdown';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from '@src/localization/hooks/useTranslation';

type AddMedicationScreenProps = NativeStackScreenProps<any, 'AddMedication'>;

type MedicationForm = {
  name: string;
  activeIngredient: string;
  dosage: string;
  frequency: string;
  administration: string;
  startDate: string | null;
  endDate: string | null;
  status: MedicationStatus | null;
  notes: string;
};

const AddMedicationScreen: React.FC<AddMedicationScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { elderlyId } = route.params;
  const insets = useSafeAreaInsets();
  const { addMedication } = useElderlyDetailsStore();
  const { handleError, handleSuccess, handleValidationError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<MedicationForm>({
    name: '',
    activeIngredient: '',
    dosage: '',
    frequency: '',
    administration: '',
    startDate: null,
    endDate: null,
    status: MedicationStatus.ACTIVE,
    notes: '',
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

  const validateForm = (): boolean => {
    if (!form.name || !form.name.trim()) {
      handleValidationError(t('medication.medicationNameRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const medicationData: CreateMedicationRequest = {
        name: form.name,
        activeIngredient: form.activeIngredient || undefined,
        dosage: form.dosage,
        frequency: form.frequency,
        administration: form.administration || undefined,
        startDate: form.startDate ? new Date(form.startDate) : undefined,
        endDate: form.endDate ? new Date(form.endDate) : undefined,
        status: form.status,
        notes: form.notes || undefined,
      };

      await addMedication(elderlyId, medicationData);

      handleSuccess(t('medication.medicationAddedSuccessfully'));
      navigation.goBack();
    } catch (error) {
      console.error('Error adding medication:', error);
      handleError(error, t('medication.failedToAddMedication'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 60) + 20 }
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <VStack spacing={Spacing.lg_24} style={styles.content}>
        <VStack spacing={Spacing.md_16} style={styles.form}>
          <FormTextInput
            title={t('medication.medicationName')}
            placeholder={t('medication.enterMedicationName')}
            value={form.name}
            onChangeText={(value) => handleInputChange('name', value)}
            required
          />

          <FormTextInput
            title={t('medication.activeIngredient')}
            placeholder={t('medication.enterActiveIngredient')}
            value={form.activeIngredient}
            onChangeText={(value) => handleInputChange('activeIngredient', value)}
          />

          <FormTextInput
            title={t('medication.dosage')}
            placeholder={t('medication.dosagePlaceholder')}
            value={form.dosage}
            onChangeText={(value) => handleInputChange('dosage', value)}
          />

          <FormTextInput
            title={t('medication.frequency')}
            placeholder={t('medication.frequencyPlaceholder')}
            value={form.frequency}
            onChangeText={(value) => handleInputChange('frequency', value)}
          />

          <FormTextInput
            title={t('medication.administrationRoute')}
            placeholder={t('medication.administrationPlaceholder')}
            value={form.administration}
            onChangeText={(value) => handleInputChange('administration', value)}
          />

          <FormDateInput
            title={t('medication.startDate')}
            placeholder={t('medication.selectStartDate')}
            value={form.startDate}
            onDateChange={(date) => handleInputChange('startDate', date)}
            maximumDate={form.endDate ? new Date(form.endDate) : undefined}
          />

          <FormDateInput
            title={t('medication.endDate')}
            placeholder={t('medication.selectEndDate')}
            value={form.endDate}
            onDateChange={(date) => handleInputChange('endDate', date)}
            minimumDate={form.startDate ? new Date(form.startDate) : new Date()}
          />

          <FormDropdown
            title={t('medication.status')}
            placeholder={t('medication.selectStatus')}
            value={form.status}
            onValueChange={(value) => handleInputChange('status', value)}
            options={statusOptions}
          />

          <FormTextInput
            title={t('medication.notes')}
            placeholder={t('medication.additionalNotesPlaceholder')}
            value={form.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline
            numberOfLines={4}
          />
        </VStack>

        <VStack spacing={Spacing.md_16} style={styles.buttonContainer}>
          <PrimaryButton
            title={t('medication.addMedication')}
            onPress={handleSubmit}
            loading={loading}
          />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButton}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </VStack>
      </VStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
  content: {
  },
  title: {
    fontSize: FontSize.heading3_24,
    fontFamily: FontFamily.extraBold,
    color: Color.dark,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    marginBottom: Spacing.xs_4,
  },
  buttonContainer: {
    width: '100%',
    marginTop: Spacing.lg_24,
  },
  cancelButton: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
    textAlign: 'center',
    paddingBottom: Spacing.lg_24,
  },
});

export default AddMedicationScreen;
