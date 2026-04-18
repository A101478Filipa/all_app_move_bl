import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useElderlyDetailsStore } from '@src/stores';
import { CreateMeasurementRequest, MeasurementType, MeasurementUnit } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { VStack } from '@components/CoreComponents';
import { PrimaryButton } from '@components/ButtonComponents';
import { FormTextInput } from '@components/forms/FormTextInput';
import { DropdownOption, FormDropdown } from '@components/forms/FormDropdown';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from 'react-i18next';

type AddMeasurementScreenProps = NativeStackScreenProps<any, 'AddMeasurement'>;

interface MeasurementForm {
  type: MeasurementType | null;
  value: string | null;
  unit: MeasurementUnit | null;
  notes: string | null;
}

const getMeasurementTypes = (t: any): DropdownOption<MeasurementType>[] => [
  { label: t('measurements.weight'), value: MeasurementType.WEIGHT },
  { label: t('measurements.height'), value: MeasurementType.HEIGHT },
  { label: t('measurements.bloodPressureSystolic'), value: MeasurementType.BLOOD_PRESSURE_SYSTOLIC },
  { label: t('measurements.bloodPressureDiastolic'), value: MeasurementType.BLOOD_PRESSURE_DIASTOLIC },
  { label: t('measurements.heartRate'), value: MeasurementType.HEART_RATE },
  { label: t('measurements.bodyTemperature'), value: MeasurementType.BODY_TEMPERATURE },
  { label: t('measurements.bloodGlucose'), value: MeasurementType.BLOOD_GLUCOSE },
  { label: t('measurements.oxygenSaturation'), value: MeasurementType.OXYGEN_SATURATION },
  { label: t('measurements.balanceScore'), value: MeasurementType.BALANCE_SCORE },
  { label: t('measurements.mobilityScore'), value: MeasurementType.MOBILITY_SCORE },
  { label: t('measurements.cognitiveScore'), value: MeasurementType.COGNITIVE_SCORE },
];

const getAllMeasurementUnits = (t: any): DropdownOption<MeasurementUnit>[] => [
  { label: t('measurements.kilograms'), value: MeasurementUnit.KILOGRAMS },
  { label: t('measurements.centimeters'), value: MeasurementUnit.CENTIMETERS },
  { label: t('measurements.points'), value: MeasurementUnit.POINTS },
  { label: t('measurements.seconds'), value: MeasurementUnit.SECONDS },
];

const measurementTypeUnits: Record<MeasurementType, MeasurementUnit[]> = {
  [MeasurementType.WEIGHT]: [MeasurementUnit.KILOGRAMS],
  [MeasurementType.HEIGHT]: [MeasurementUnit.CENTIMETERS],
  [MeasurementType.BLOOD_PRESSURE_SYSTOLIC]: [MeasurementUnit.POINTS],
  [MeasurementType.BLOOD_PRESSURE_DIASTOLIC]: [MeasurementUnit.POINTS],
  [MeasurementType.HEART_RATE]: [MeasurementUnit.POINTS],
  [MeasurementType.BODY_TEMPERATURE]: [MeasurementUnit.POINTS],
  [MeasurementType.BLOOD_GLUCOSE]: [MeasurementUnit.POINTS],
  [MeasurementType.OXYGEN_SATURATION]: [MeasurementUnit.POINTS],
  [MeasurementType.BALANCE_SCORE]: [MeasurementUnit.POINTS],
  [MeasurementType.MOBILITY_SCORE]: [MeasurementUnit.POINTS],
  [MeasurementType.COGNITIVE_SCORE]: [MeasurementUnit.POINTS],
};

const AddMeasurementScreen: React.FC<AddMeasurementScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { elderlyId, prefillType } = route.params;
  const [loading, setLoading] = useState(false);
  const { addMeasurement } = useElderlyDetailsStore();
  const { handleError, handleSuccess, handleValidationError } = useErrorHandler();
  const insets = useSafeAreaInsets();
  
  const getInitialForm = (): MeasurementForm => {
    const initialType = prefillType || null;
    let initialUnit: MeasurementUnit | null = null;
    
    if (initialType) {
      const availableUnits = measurementTypeUnits[initialType] || [];
      if (availableUnits.length > 0) {
        initialUnit = availableUnits[0];
      }
    }
    
    return {
      type: initialType,
      value: null,
      unit: initialUnit,
      notes: null,
    };
  };
  
  const [form, setForm] = useState<MeasurementForm>(getInitialForm());

  const measurementTypes = getMeasurementTypes(t);
  const allMeasurementUnits = getAllMeasurementUnits(t);

  const handleInputChange = (
    field: keyof MeasurementForm,
    value: string | MeasurementType | MeasurementUnit | null
  ) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };

      if (field === 'type' && value) {
        const availableUnits = getAvailableUnits(value as MeasurementType);

        if (availableUnits.length > 0) {
          newForm.unit = availableUnits[0].value;
        }
      }

      return newForm;
    });
  };

  const getAvailableUnits = (measurementType: MeasurementType) => {
    const availableUnitValues = measurementTypeUnits[measurementType] || [];

    return availableUnitValues.map(unitValue => {
      const defaultUnit = allMeasurementUnits.find(unit => unit.value === unitValue);
      return defaultUnit || { label: unitValue, value: unitValue };
    });
  };

  const getCurrentAvailableUnits = () => {
    return getAvailableUnits(form.type);
  };

  const validateForm = (): boolean => {
    if (!form.type) {
      handleValidationError(t('measurements.measurementTypeRequired'));
      return false;
    }
    if (!form.value || !form.value.trim()) {
      handleValidationError(t('measurements.measurementValueRequired'));
      return false;
    }
    if (isNaN(Number(form.value))) {
      handleValidationError(t('measurements.measurementValueMustBeNumber'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const measurementData: CreateMeasurementRequest = {
        type: form.type,
        value: Number(form.value),
        unit: MeasurementUnit[form.unit as keyof typeof MeasurementUnit],
        notes: form.notes,
      };

      await addMeasurement(elderlyId, measurementData);

      handleSuccess(t('measurements.measurementAddedSuccessfully'));
      navigation.goBack();
    } catch (error) {
      console.error('Error adding measurement:', error);
      handleError(error, t('measurements.failedToAddMeasurement'));
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
          <FormDropdown
            title={t('measurements.measurementType')}
            placeholder={t('measurements.selectMeasurementType')}
            value={form.type}
            onValueChange={(value) => handleInputChange('type', value)}
            options={measurementTypes}
            required
          />

          <FormTextInput
            title={t('measurements.value')}
            placeholder={t('measurements.enterMeasurementValue')}
            value={form.value}
            onChangeText={(value) => handleInputChange('value', value)}
            keyboardType="numeric"
            required
          />

          <FormDropdown
            title={t('measurements.unit')}
            placeholder={t('measurements.selectMeasurementUnit')}
            value={form.unit}
            onValueChange={(value) => handleInputChange('unit', value)}
            options={getCurrentAvailableUnits()}
            required
          />

          <FormTextInput
            title={t('measurements.notes')}
            placeholder={t('measurements.additionalNotes')}
            value={form.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline
            numberOfLines={4}
          />
        </VStack>

        <VStack spacing={Spacing.md_16} style={styles.buttonContainer}>
          <PrimaryButton
            title={t('measurements.addMeasurement')}
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
  buttonContainer: {
    width: '100%',
    marginTop: Spacing.lg_24,
  },
  cancelButton: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
    textAlign: 'center',
  },
});

export default AddMeasurementScreen;
