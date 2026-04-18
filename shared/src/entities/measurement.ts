import { MeasurementUnit } from "../enums/measurementUnit";
import { MeasurementType } from "../enums/measurementType";

export interface Measurement {
  id: number;
  elderlyId: number;
  assessmentId?: number | null;
  type: MeasurementType;
  value: number;
  unit: MeasurementUnit;
  notes?: string | null;
  measuredById: number;
  createdAt: Date;
}