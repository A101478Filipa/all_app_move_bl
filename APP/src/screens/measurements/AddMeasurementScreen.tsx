import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useElderlyDetailsStore } from '@src/stores';
import { CreateMeasurementRequest, MeasurementStatus, MeasurementType, MeasurementUnit } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { VStack } from '@components/CoreComponents';
import { PrimaryButton } from '@components/ButtonComponents';
import { FormTextInput } from '@components/forms/FormTextInput';
import { DropdownOption, FormDropdown } from '@components/forms/FormDropdown';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import {
  calculateBMI,
  getBMILabel,
  getBMIStatus,
  getAutoStatus,
  getReferenceStatus,
  isSemiAutoStatusType,
  isAutoStatusType,
  MEASUREMENT_STATUS_COLORS,
  MEASUREMENT_STATUS_BG_COLORS,
  getStatusLabel,
  MeasurementStatus as LocalStatus,
} from '@utils/healthColorSystem';
import { MeasurementStatusBadge } from '@components/MeasurementStatusBadge';
import { MeasurementConflictModal } from '@components/MeasurementConflictModal';

type AddMeasurementScreenProps = NativeStackScreenProps<any, 'AddMeasurement'>;

interface MeasurementForm {
  type: MeasurementType | null;
  value: string | null;
  unit: MeasurementUnit | null;
  notes: string | null;
  /** Doctor's chosen status — only used for semi-automatic types */
  doctorStatus: MeasurementStatus | null;
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
  const { addMeasurement, elderly } = useElderlyDetailsStore();
  const { handleError, handleSuccess, handleValidationError } = useErrorHandler();
  const insets = useSafeAreaInsets();

  // Conflict-modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingData, setPendingData] = useState<CreateMeasurementRequest | null>(null);
  
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
      doctorStatus: null,
    };
  };
  
  const [form, setForm] = useState<MeasurementForm>(getInitialForm());

  const measurementTypes = getMeasurementTypes(t);
  const allMeasurementUnits = getAllMeasurementUnits(t);

  const handleInputChange = (
    field: keyof MeasurementForm,
    value: string | MeasurementType | MeasurementUnit | MeasurementStatus | null
  ) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };

      if (field === 'type' && value) {
        const availableUnits = getAvailableUnits(value as MeasurementType);
        if (availableUnits.length > 0) {
          newForm.unit = availableUnits[0].value;
        }
        // Reset doctor status when switching measurement type
        newForm.doctorStatus = null;
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
    if (isSemiAutoStatusType(form.type) && !form.doctorStatus) {
      handleValidationError(t('measurements.statusRequired'));
      return false;
    }
    return true;
  };

  // ─── BMI helper ─────────────────────────────────────────────────────────────

  const bmiInfo = useMemo(() => {
    if (!form.type || !form.value) return null;
    const numVal = Number(form.value);
    if (isNaN(numVal)) return null;

    const measurements = elderly?.measurements ?? [];

    let weightKg: number | null = null;
    let heightCm: number | null = null;

    if (form.type === MeasurementType.WEIGHT) {
      weightKg = numVal;
      const lastHeight = [...measurements]
        .reverse()
        .find(m => m.type === MeasurementType.HEIGHT);
      heightCm = lastHeight ? lastHeight.value : null;
    } else if (form.type === MeasurementType.HEIGHT) {
      heightCm = numVal;
      const lastWeight = [...measurements]
        .reverse()
        .find(m => m.type === MeasurementType.WEIGHT);
      weightKg = lastWeight ? lastWeight.value : null;
    }

    if (weightKg && heightCm) {
      const bmi = calculateBMI(weightKg, heightCm);
      return { bmi: bmi.toFixed(1), status: getBMIStatus(bmi), label: getBMILabel(bmi) };
    }
    return null;
  }, [form.type, form.value, elderly?.measurements]);

  // ─── Auto status (temperature) ──────────────────────────────────────────────

  const autoStatus = useMemo<LocalStatus | null>(() => {
    if (!form.type || !form.value) return null;
    const numVal = Number(form.value);
    if (isNaN(numVal)) return null;
    return getAutoStatus(form.type, numVal);
  }, [form.type, form.value]);

  // ─── Submit logic ────────────────────────────────────────────────────────────

  const buildMeasurementData = (): CreateMeasurementRequest => {
    const numVal = Number(form.value);
    // For auto types, compute status from value; for semi-auto, use doctor's choice
    let status: MeasurementStatus | null = null;
    if (isAutoStatusType(form.type!)) {
      status = (autoStatus as MeasurementStatus | null);
    } else if (isSemiAutoStatusType(form.type!)) {
      status = form.doctorStatus;
    }
    return {
      type: form.type!,
      value: numVal,
      unit: MeasurementUnit[form.unit as keyof typeof MeasurementUnit],
      status,
      notes: form.notes,
    };
  };

  const doSubmit = async (data: CreateMeasurementRequest) => {
    setLoading(true);
    try {
      await addMeasurement(elderlyId, data);
      handleSuccess(t('measurements.measurementAddedSuccessfully'));
      navigation.goBack();
    } catch (error) {
      console.error('Error adding measurement:', error);
      handleError(error, t('measurements.failedToAddMeasurement'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const data = buildMeasurementData();

    // For semi-auto types, validate doctor's status against reference
    if (isSemiAutoStatusType(form.type!) && form.doctorStatus) {
      const refStatus = getReferenceStatus(form.type!, Number(form.value));
      if (refStatus && refStatus !== form.doctorStatus) {
        setPendingData(data);
        setShowConflictModal(true);
        return;
      }
    }

    await doSubmit(data);
  };

  return (
    <>
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

            {/* ── Auto status feedback (Body Temperature) ── */}
            {autoStatus && (
              <View style={styles.feedbackCard}>
                <Text style={styles.feedbackLabel}>{t('measurements.autoStatus')}</Text>
                <MeasurementStatusBadge status={autoStatus as any} />
              </View>
            )}

            {/* ── BMI info (Weight / Height) ── */}
            {bmiInfo && (
              <View style={styles.feedbackCard}>
                <Text style={styles.feedbackLabel}>
                  {t('measurements.bmiCalculated', { bmi: bmiInfo.bmi })}
                </Text>
                <MeasurementStatusBadge
                  status={bmiInfo.status as any}
                  subLabel={bmiInfo.label}
                />
              </View>
            )}

            {/* ── Doctor status picker (semi-automatic types) ── */}
            {form.type && isSemiAutoStatusType(form.type) && (
              <VStack spacing={Spacing.xs_4} style={styles.statusPickerContainer}>
                <Text style={styles.statusPickerTitle}>
                  {t('measurements.statusLabel')} <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.statusPickerRow}>
                  {(['GREEN', 'YELLOW', 'RED'] as LocalStatus[]).map(s => {
                    const isSelected = form.doctorStatus === s as unknown as MeasurementStatus;
                    const color = MEASUREMENT_STATUS_COLORS[s];
                    const bg = MEASUREMENT_STATUS_BG_COLORS[s];
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.statusOption,
                          { borderColor: isSelected ? color : Color.Gray.v200 },
                          isSelected && { backgroundColor: bg },
                        ]}
                        onPress={() => handleInputChange('doctorStatus', s as unknown as MeasurementStatus)}
                      >
                        <MaterialIcons
                          name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                          size={18}
                          color={isSelected ? color : Color.Gray.v400}
                        />
                        <Text style={[styles.statusOptionText, isSelected && { color }]}>
                          {getStatusLabel(s)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </VStack>
            )}

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

      {/* Conflict validation modal */}
      {showConflictModal && pendingData && form.doctorStatus && (
        <MeasurementConflictModal
          visible={showConflictModal}
          doctorStatus={form.doctorStatus}
          referenceStatus={getReferenceStatus(form.type!, Number(form.value)) as any ?? form.doctorStatus}
          onConfirm={async () => {
            setShowConflictModal(false);
            await doSubmit(pendingData);
          }}
          onCorrect={() => {
            setShowConflictModal(false);
            setPendingData(null);
          }}
        />
      )}
    </>
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
  feedbackCard: {
    backgroundColor: Color.Background.white,
    borderRadius: 8,
    padding: Spacing.md_16,
    gap: Spacing.xs_4,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  feedbackLabel: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
    marginBottom: 4,
  },
  statusPickerContainer: {
    alignSelf: 'stretch',
  },
  statusPickerTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
  },
  required: {
    color: Color.Error.default,
  },
  statusPickerRow: {
    flexDirection: 'row',
    gap: Spacing.xs_4,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: 4,
    borderColor: Color.Gray.v200,
  },
  statusOptionText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
  },
});

export default AddMeasurementScreen;
