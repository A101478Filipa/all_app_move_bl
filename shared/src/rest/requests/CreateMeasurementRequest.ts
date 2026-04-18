import { z } from 'zod';
import { MeasurementUnit } from '../../enums/measurementUnit';
import { MeasurementType } from '../../enums/measurementType';

export const CreateMeasurementRequest = z.object({
  assessmentId: z.number().positive().optional(),
  type: z.nativeEnum(MeasurementType, {
    errorMap: () => ({ message: "Valid measurement type is required" })
  }),
  value: z.number({
    required_error: "Measurement value is required",
    invalid_type_error: "Measurement value must be a number"
  }),
  unit: z.nativeEnum(MeasurementUnit, {
    errorMap: () => ({ message: "Valid measurement unit is required" })
  }),
  notes: z.string().nullable().optional(),
});

export type CreateMeasurementRequest = z.infer<typeof CreateMeasurementRequest>;
