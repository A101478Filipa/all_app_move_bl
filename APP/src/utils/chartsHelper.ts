import { Measurement, MeasurementType } from "moveplus-shared";
import { lineDataItem } from "react-native-gifted-charts";
import { formatDate } from "./Date";
import { getMeasurementDisplayStatus, MEASUREMENT_STATUS_COLORS, calculateBMI, getBMIStatus } from "./healthColorSystem";

export interface MeasurementChartDataItem extends lineDataItem {
  measurementId?: number;
}

const getDisplayValueForChart = (measurement: Measurement) => {
  return measurement.value;
};

const getDisplayTextForChart = (measurement: Measurement) => {
  switch (measurement.unit) {
    case 'KILOGRAMS':
      return measurement.value.toFixed(1);
    case 'CENTIMETERS':
    case 'SECONDS':
    case 'POINTS':
    default:
      return String(measurement.value);
  }
};

export const groupMeasurementsForChart = (
  measurements: Measurement[],
  heightMeasurements?: Measurement[],
) => {
  const grouped: Partial<Record<MeasurementType, MeasurementChartDataItem[]>> = {};

  // Find the most recent height for BMI computation
  const latestHeight = heightMeasurements?.length
    ? [...heightMeasurements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : undefined;

  measurements.forEach(m => {
    const type = m.type;
    if (!grouped[type]) {
      grouped[type] = [];
    }

    let displayStatus = getMeasurementDisplayStatus(type, m.value, m.status);
    // For WEIGHT without a stored status, derive color from BMI if height is available
    if (!displayStatus && type === MeasurementType.WEIGHT && latestHeight) {
      displayStatus = getBMIStatus(calculateBMI(m.value, latestHeight.value));
    }
    const dataPointColor = displayStatus ? MEASUREMENT_STATUS_COLORS[displayStatus] : undefined;

    grouped[type]!.push({
      value: getDisplayValueForChart(m),
      label: formatDate(m.createdAt),
      dataPointText: getDisplayTextForChart(m),
      measurementId: m.id,
      ...(dataPointColor ? { dataPointColor } : {}),
    });
  });

  return grouped;
};

export const groupMeasurements = (measurements: Measurement[]): Partial<Record<MeasurementType, Measurement[]>> => {
  return measurements.reduce((acc, curr) => {
    const type = curr.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type]!.push(curr);
    return acc;
  }, {} as Partial<Record<MeasurementType, Measurement[]>>);
};
