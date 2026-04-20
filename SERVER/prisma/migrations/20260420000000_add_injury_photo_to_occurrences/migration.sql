-- AlterTable: Add injuryPhotoUrl to FallOccurrence
ALTER TABLE "FallOccurrence" ADD COLUMN IF NOT EXISTS "injuryPhotoUrl" TEXT;

-- AlterTable: Add injuryPhotoUrl and missing fields to SosOccurrence
ALTER TABLE "SosOccurrence" ADD COLUMN IF NOT EXISTS "injuryPhotoUrl" TEXT;
ALTER TABLE "SosOccurrence" ADD COLUMN IF NOT EXISTS "recovery" TEXT;
ALTER TABLE "SosOccurrence" ADD COLUMN IF NOT EXISTS "preActivity" TEXT;
ALTER TABLE "SosOccurrence" ADD COLUMN IF NOT EXISTS "postActivity" TEXT;
ALTER TABLE "SosOccurrence" ADD COLUMN IF NOT EXISTS "direction" TEXT;
ALTER TABLE "SosOccurrence" ADD COLUMN IF NOT EXISTS "environment" TEXT;
ALTER TABLE "SosOccurrence" ADD COLUMN IF NOT EXISTS "injured" BOOLEAN;
ALTER TABLE "SosOccurrence" ADD COLUMN IF NOT EXISTS "injuryDescription" TEXT;
ALTER TABLE "SosOccurrence" ADD COLUMN IF NOT EXISTS "measuresTaken" TEXT;
