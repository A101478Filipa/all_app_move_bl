import { Measurement, MeasurementType } from "moveplus-shared";
import { lineDataItem } from "react-native-gifted-charts";
import { formatDate } from "./Date";

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

export const groupMeasurementsForChart = (measurements: Measurement[]) => {
  const grouped: Partial<Record<MeasurementType, MeasurementChartDataItem[]>> = {};

  measurements.forEach(m => {
    const type = m.type;
    if (!grouped[type]) {
      grouped[type] = [];
    }

    grouped[type]!.push({
      value: getDisplayValueForChart(m),
      label: formatDate(m.createdAt),
      dataPointText: getDisplayTextForChart(m),
      measurementId: m.id,
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
