import { MeasurementUnit } from "../enums/measurementUnit";
import { MeasurementType } from "../enums/measurementType";
import { MeasurementStatus } from "../enums/measurementStatus";

export interface Measurement {
  id: number;
  elderlyId: number;
  assessmentId?: number | null;
  type: MeasurementType;
  value: number;
  unit: MeasurementUnit;
  status?: MeasurementStatus | null;
  notes?: string | null;
  measuredById: number;
  createdAt: Date;
}