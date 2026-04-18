/**
 * Get the symbol for a measurement unit
 */
export const getMeasurementUnitSymbol = (unit: MeasurementUnit): string => {
  switch (unit) {
    case MeasurementUnit.KILOGRAMS:
      return 'kg';
    case MeasurementUnit.CENTIMETERS:
      return 'cm';
    case MeasurementUnit.SECONDS:
      return 's';
    case MeasurementUnit.BPM:
      return 'bpm';
    case MeasurementUnit.MMHG:
      return 'mmHg';
    case MeasurementUnit.PERCENTAGE:
      return '%';
    case MeasurementUnit.POINTS:
      return '';
    default:
      return '';
  }
};
import { MeasurementType, MeasurementUnit } from 'moveplus-shared';
import { TFunction } from 'i18next';

/**
 * Get the translated display name for a measurement type
 */
export const getMeasurementTypeLabel = (type: MeasurementType, t: TFunction): string => {
  return t(`measurements.measurementTypes.${type}`);
};

/**
 * Get the translated display name for a measurement unit
 */
export const getMeasurementUnitLabel = (unit: MeasurementUnit, t: TFunction): string => {
  return t(`measurements.measurementUnits.${unit}`);
};

/**
 * Get the formatted measurement display with type, value, and unit
 */
export const formatMeasurementDisplay = (
  type: MeasurementType,
  value: number,
  unit: MeasurementUnit,
  t: TFunction
): string => {
  const typeLabel = getMeasurementTypeLabel(type, t);
  const unitLabel = getMeasurementUnitLabel(unit, t);
  return `${typeLabel}: ${value} ${unitLabel}`;
};

/**
 * Get the default unit for a measurement type
 */
export const getDefaultMeasurementUnit = (type: MeasurementType): MeasurementUnit => {
  switch (type) {
    case MeasurementType.BLOOD_PRESSURE_SYSTOLIC:
    case MeasurementType.BLOOD_PRESSURE_DIASTOLIC:
      return MeasurementUnit.MMHG;
    case MeasurementType.HEART_RATE:
      return MeasurementUnit.BPM;
    case MeasurementType.WEIGHT:
      return MeasurementUnit.KILOGRAMS;
    case MeasurementType.HEIGHT:
      return MeasurementUnit.CENTIMETERS;
    case MeasurementType.BODY_TEMPERATURE:
      return MeasurementUnit.POINTS; // Could be Celsius, but we'll use points for now
    case MeasurementType.BLOOD_GLUCOSE:
      return MeasurementUnit.POINTS; // mg/dL or mmol/L, but we'll use points for simplicity
    case MeasurementType.OXYGEN_SATURATION:
      return MeasurementUnit.PERCENTAGE;
    case MeasurementType.BALANCE_SCORE:
    case MeasurementType.MOBILITY_SCORE:
    case MeasurementType.COGNITIVE_SCORE:
      return MeasurementUnit.POINTS;
    default:
      return MeasurementUnit.POINTS;
  }
};

/**
 * Get measurement types suitable for different categories
 */
export const getMeasurementTypesByCategory = () => {
  return {
    vitalSigns: [
      MeasurementType.BLOOD_PRESSURE_SYSTOLIC,
      MeasurementType.BLOOD_PRESSURE_DIASTOLIC,
      MeasurementType.HEART_RATE,
      MeasurementType.BODY_TEMPERATURE,
      MeasurementType.OXYGEN_SATURATION,
      MeasurementType.BLOOD_GLUCOSE,
    ],
    physical: [
      MeasurementType.WEIGHT,
      MeasurementType.HEIGHT,
    ],
    assessments: [
      MeasurementType.BALANCE_SCORE,
      MeasurementType.MOBILITY_SCORE,
      MeasurementType.COGNITIVE_SCORE,
    ],
  };
};