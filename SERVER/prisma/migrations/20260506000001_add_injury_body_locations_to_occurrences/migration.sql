-- Add injuryBodyLocations to FallOccurrence and SosOccurrence
ALTER TABLE "FallOccurrence" ADD COLUMN IF NOT EXISTS "injuryBodyLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SosOccurrence" ADD COLUMN IF NOT EXISTS "injuryBodyLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
