-- Add MeasurementStatus enum and status column to Measurement table

-- CreateEnum
CREATE TYPE "MeasurementStatus" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- AlterTable
ALTER TABLE "Measurement" ADD COLUMN "status" "MeasurementStatus";
