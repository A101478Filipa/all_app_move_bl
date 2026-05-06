/**
 * Health Color System — Traffic-light feedback for geriatric health measurements.
 *
 * - AUTOMATIC types: status is always computed from the numeric value.
 * - SEMI_AUTOMATIC types: the doctor chooses a status; the system validates it
 *   against an internal reference scale and warns on conflict.
 */

import { MeasurementType } from 'moveplus-shared';

// ─── Status type ───────────────────────────────────────────────────────────────

export type MeasurementStatus = 'GREEN' | 'YELLOW' | 'RED';

export const MEASUREMENT_STATUS_COLORS: Record<MeasurementStatus, string> = {
  GREEN: '#4CAF50',
  YELLOW: '#FFC107',
  RED: '#F44336',
};

export const MEASUREMENT_STATUS_BG_COLORS: Record<MeasurementStatus, string> = {
  GREEN: '#E8F5E9',
  YELLOW: '#FFF8E1',
  RED: '#FFEBEE',
};

// ─── Category helpers ──────────────────────────────────────────────────────────

/**
 * Types where the status is computed 100% automatically from the value.
 * BMI is derived (requires weight + height).
 */
export const AUTO_STATUS_TYPES = new Set<MeasurementType>([
  MeasurementType.BODY_TEMPERATURE,
  MeasurementType.WEIGHT,   // triggers BMI recalculation
  MeasurementType.HEIGHT,   // triggers BMI recalculation
]);

/**
 * Types where the doctor picks a status and the system validates it.
 */
export const SEMI_AUTO_STATUS_TYPES = new Set<MeasurementType>([
  MeasurementType.BLOOD_PRESSURE_SYSTOLIC,
  MeasurementType.BLOOD_PRESSURE_DIASTOLIC,
  MeasurementType.OXYGEN_SATURATION,
  MeasurementType.BLOOD_GLUCOSE,
  MeasurementType.HEART_RATE,
  MeasurementType.BALANCE_SCORE,
]);

export const isAutoStatusType = (type: MeasurementType): boolean =>
  AUTO_STATUS_TYPES.has(type);

export const isSemiAutoStatusType = (type: MeasurementType): boolean =>
  SEMI_AUTO_STATUS_TYPES.has(type);

export const hasStatusFeedback = (type: MeasurementType): boolean =>
  isAutoStatusType(type) || isSemiAutoStatusType(type);

// ─── BMI ───────────────────────────────────────────────────────────────────────

/**
 * Calculates BMI using weight in kg and height in cm.
 */
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

/**
 * Geriatric BMI scale (Lipschitz):
 *   < 22.0  → RED   (undernutrition / risk)
 *   22–27   → GREEN (normal)
 *   27.1–30 → YELLOW (overweight)
 *   > 30    → RED   (obesity)
 */
export const getBMIStatus = (bmi: number): MeasurementStatus => {
  if (bmi < 22.0) return 'RED';
  if (bmi <= 27.0) return 'GREEN';
  if (bmi <= 30.0) return 'YELLOW';
  return 'RED';
};

export const getBMILabel = (bmi: number): string => {
  if (bmi < 22.0) return 'Desnutrição / Risco';
  if (bmi <= 27.0) return 'Eutrofia (Adequado)';
  if (bmi <= 30.0) return 'Excesso de Peso';
  return 'Obesidade';
};

// ─── Body Temperature ──────────────────────────────────────────────────────────

/**
 * Geriatric temperature scale (°C):
 *   < 35.0       → RED    (hypothermia)
 *   35.0–35.7    → YELLOW (cold risk)
 *   35.8–37.2    → GREEN  (normal)
 *   37.3–37.7    → YELLOW (low-grade fever / attention)
 *   > 37.7       → RED    (fever)
 */
export const getTemperatureStatus = (tempC: number): MeasurementStatus => {
  if (tempC < 35.0) return 'RED';
  if (tempC <= 35.7) return 'YELLOW';
  if (tempC <= 37.2) return 'GREEN';
  if (tempC <= 37.7) return 'YELLOW';
  return 'RED';
};

export const getTemperatureLabel = (tempC: number): string => {
  if (tempC < 35.0) return 'Hipotermia';
  if (tempC <= 35.7) return 'Risco de Frio';
  if (tempC <= 37.2) return 'Normal';
  if (tempC <= 37.7) return 'Febrícula / Atenção';
  return 'Febre';
};

// ─── Reference scales for semi-automatic measurements ─────────────────────────

/**
 * Systolic Blood Pressure (mmHg) — geriatric reference:
 *   < 90         → RED    (hypotension)
 *   90–139       → GREEN  (normal)
 *   140–159      → YELLOW (stage 1 hypertension)
 *   ≥ 160        → RED    (stage 2+ hypertension)
 */
export const getSystolicBPReferenceStatus = (value: number): MeasurementStatus => {
  if (value < 90) return 'RED';
  if (value <= 139) return 'GREEN';
  if (value <= 159) return 'YELLOW';
  return 'RED';
};

/**
 * Diastolic Blood Pressure (mmHg):
 *   < 60         → RED
 *   60–89        → GREEN
 *   90–99        → YELLOW
 *   ≥ 100        → RED
 */
export const getDiastolicBPReferenceStatus = (value: number): MeasurementStatus => {
  if (value < 60) return 'RED';
  if (value <= 89) return 'GREEN';
  if (value <= 99) return 'YELLOW';
  return 'RED';
};

/**
 * SpO2 / Oxygen Saturation (%):
 *   < 90         → RED
 *   90–94        → YELLOW
 *   ≥ 95         → GREEN
 */
export const getSpO2ReferenceStatus = (value: number): MeasurementStatus => {
  if (value < 90) return 'RED';
  if (value < 95) return 'YELLOW';
  return 'GREEN';
};

/**
 * Blood Glucose (mg/dL) — fasting reference:
 *   < 70         → RED    (hypoglycaemia)
 *   70–99        → GREEN  (normal fasting)
 *   100–125      → YELLOW (pre-diabetes)
 *   ≥ 126        → RED    (diabetes range)
 */
export const getBloodGlucoseReferenceStatus = (value: number): MeasurementStatus => {
  if (value < 70) return 'RED';
  if (value <= 99) return 'GREEN';
  if (value <= 125) return 'YELLOW';
  return 'RED';
};

/**
 * Heart Rate (bpm):
 *   < 50         → RED    (severe bradycardia)
 *   50–59        → YELLOW (mild bradycardia)
 *   60–100       → GREEN  (normal)
 *   101–119      → YELLOW (mild tachycardia)
 *   ≥ 120        → RED    (significant tachycardia)
 */
export const getHeartRateReferenceStatus = (value: number): MeasurementStatus => {
  if (value < 50) return 'RED';
  if (value < 60) return 'YELLOW';
  if (value <= 100) return 'GREEN';
  if (value <= 119) return 'YELLOW';
  return 'RED';
};

/**
 * Balance Score — Berg Scale (0–56):
 *   0–20   → RED    (high risk)
 *   21–40  → YELLOW (medium risk)
 *   41–56  → GREEN  (low risk)
 */
export const getBalanceScoreReferenceStatus = (value: number): MeasurementStatus => {
  if (value <= 20) return 'RED';
  if (value <= 40) return 'YELLOW';
  return 'GREEN';
};

// ─── Unified reference resolver ────────────────────────────────────────────────

/**
 * Returns the reference (expected) status for a given measurement type and value.
 * Used to validate the doctor's chosen status against the scale.
 * Returns null for types without a defined reference scale.
 */
export const getReferenceStatus = (
  type: MeasurementType,
  value: number,
): MeasurementStatus | null => {
  switch (type) {
    case MeasurementType.BODY_TEMPERATURE:
      return getTemperatureStatus(value);
    case MeasurementType.BLOOD_PRESSURE_SYSTOLIC:
      return getSystolicBPReferenceStatus(value);
    case MeasurementType.BLOOD_PRESSURE_DIASTOLIC:
      return getDiastolicBPReferenceStatus(value);
    case MeasurementType.OXYGEN_SATURATION:
      return getSpO2ReferenceStatus(value);
    case MeasurementType.BLOOD_GLUCOSE:
      return getBloodGlucoseReferenceStatus(value);
    case MeasurementType.HEART_RATE:
      return getHeartRateReferenceStatus(value);
    case MeasurementType.BALANCE_SCORE:
      return getBalanceScoreReferenceStatus(value);
    default:
      return null;
  }
};

/**
 * Returns the automatically computed status for fully automatic types.
 * For WEIGHT / HEIGHT alone there is no standalone status (BMI requires both).
 */
export const getAutoStatus = (
  type: MeasurementType,
  value: number,
): MeasurementStatus | null => {
  switch (type) {
    case MeasurementType.BODY_TEMPERATURE:
      return getTemperatureStatus(value);
    default:
      return null;
  }
};

// ─── Display helpers ───────────────────────────────────────────────────────────

export const getStatusLabel = (status: MeasurementStatus): string => {
  switch (status) {
    case 'GREEN':  return 'Bom';
    case 'YELLOW': return 'Atenção';
    case 'RED':    return 'Crítico';
  }
};

export const getStatusIcon = (status: MeasurementStatus): string => {
  switch (status) {
    case 'GREEN':  return 'check-circle';
    case 'YELLOW': return 'warning';
    case 'RED':    return 'error';
  }
};
