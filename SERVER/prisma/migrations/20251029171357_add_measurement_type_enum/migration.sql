/*
  Warnings:

  - Changed the type of `type` on the `Measurement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MeasurementType" AS ENUM ('BLOOD_PRESSURE_SYSTOLIC', 'BLOOD_PRESSURE_DIASTOLIC', 'HEART_RATE', 'WEIGHT', 'HEIGHT', 'BODY_TEMPERATURE', 'BLOOD_GLUCOSE', 'OXYGEN_SATURATION', 'BALANCE_SCORE', 'MOBILITY_SCORE', 'COGNITIVE_SCORE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "MeasurementUnit" ADD VALUE 'BPM';
ALTER TYPE "MeasurementUnit" ADD VALUE 'MMHG';
ALTER TYPE "MeasurementUnit" ADD VALUE 'PERCENTAGE';

-- AlterTable: Convert existing string types to enum values
-- First, add a temporary column with the new enum type
ALTER TABLE "Measurement" ADD COLUMN "type_new" "MeasurementType";

-- Update the temporary column based on existing string values
-- Map common string values to enum values
UPDATE "Measurement" 
SET "type_new" = CASE 
  WHEN UPPER("type") IN ('WEIGHT', 'PESO') THEN 'WEIGHT'::"MeasurementType"
  WHEN UPPER("type") IN ('HEIGHT', 'ALTURA') THEN 'HEIGHT'::"MeasurementType"
  WHEN UPPER("type") IN ('BLOOD_PRESSURE', 'PRESSÃO_ARTERIAL', 'BLOOD_PRESSURE_SYSTOLIC') THEN 'BLOOD_PRESSURE_SYSTOLIC'::"MeasurementType"
  WHEN UPPER("type") IN ('HEART_RATE', 'FREQUÊNCIA_CARDÍACA', 'HEARTRATE') THEN 'HEART_RATE'::"MeasurementType"
  WHEN UPPER("type") IN ('TEMPERATURE', 'TEMPERATURA', 'BODY_TEMPERATURE') THEN 'BODY_TEMPERATURE'::"MeasurementType"
  WHEN UPPER("type") IN ('BLOOD_SUGAR', 'BLOOD_GLUCOSE', 'GLICEMIA', 'AÇÚCAR_NO_SANGUE') THEN 'BLOOD_GLUCOSE'::"MeasurementType"
  WHEN UPPER("type") IN ('OXYGEN_SATURATION', 'SATURAÇÃO_DE_OXIGÉNIO') THEN 'OXYGEN_SATURATION'::"MeasurementType"
  WHEN UPPER("type") IN ('BALANCE_SCORE', 'BALANCE', 'EQUILÍBRIO') THEN 'BALANCE_SCORE'::"MeasurementType"
  WHEN UPPER("type") IN ('MOBILITY_SCORE', 'MOBILITY', 'MOBILIDADE') THEN 'MOBILITY_SCORE'::"MeasurementType"
  WHEN UPPER("type") IN ('COGNITIVE_SCORE', 'COGNITIVE', 'COGNITIVO') THEN 'COGNITIVE_SCORE'::"MeasurementType"
  ELSE 'WEIGHT'::"MeasurementType" -- Default fallback
END;

-- Make the temporary column NOT NULL (should be safe now)
ALTER TABLE "Measurement" ALTER COLUMN "type_new" SET NOT NULL;

-- Drop the old column and rename the new one
ALTER TABLE "Measurement" DROP COLUMN "type";
ALTER TABLE "Measurement" RENAME COLUMN "type_new" TO "type";
