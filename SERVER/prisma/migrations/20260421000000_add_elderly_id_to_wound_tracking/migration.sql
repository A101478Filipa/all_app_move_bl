-- Add elderlyId column to WoundTracking (IF NOT EXISTS makes it safe to run even if already applied via db push)
ALTER TABLE "WoundTracking" ADD COLUMN IF NOT EXISTS "elderlyId" INTEGER;

-- Add FK constraint (drop first so it's idempotent)
ALTER TABLE "WoundTracking" DROP CONSTRAINT IF EXISTS "WoundTracking_elderlyId_fkey";
ALTER TABLE "WoundTracking" ADD CONSTRAINT "WoundTracking_elderlyId_fkey"
    FOREIGN KEY ("elderlyId") REFERENCES "Elderly"("id") ON DELETE SET NULL ON UPDATE CASCADE;
