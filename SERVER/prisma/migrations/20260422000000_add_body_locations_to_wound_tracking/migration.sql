-- AlterTable
ALTER TABLE "WoundTracking" ADD COLUMN "bodyLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
