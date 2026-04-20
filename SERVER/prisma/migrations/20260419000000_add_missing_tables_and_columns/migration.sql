-- Add missing columns to CalendarEvent
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "assignedToId" INTEGER;
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "externalProfessionalName" TEXT;

-- Add foreign key for assignedToId (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CalendarEvent_assignedToId_fkey'
  ) THEN
    ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_assignedToId_fkey"
      FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add index for assignedToId
CREATE INDEX IF NOT EXISTS "CalendarEvent_assignedToId_idx" ON "CalendarEvent"("assignedToId");

-- CreateEnum TimeOffType (if not exists)
DO $$ BEGIN
  CREATE TYPE "TimeOffType" AS ENUM ('VACATION', 'SICK_LEAVE', 'DAY_OFF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable StaffWorkSchedule
CREATE TABLE IF NOT EXISTS "StaffWorkSchedule" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "workDays" INTEGER[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffWorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for StaffWorkSchedule
CREATE UNIQUE INDEX IF NOT EXISTS "StaffWorkSchedule_userId_key" ON "StaffWorkSchedule"("userId");
CREATE INDEX IF NOT EXISTS "StaffWorkSchedule_userId_idx" ON "StaffWorkSchedule"("userId");

-- AddForeignKey for StaffWorkSchedule
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StaffWorkSchedule_userId_fkey'
  ) THEN
    ALTER TABLE "StaffWorkSchedule" ADD CONSTRAINT "StaffWorkSchedule_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable StaffTimeOff
CREATE TABLE IF NOT EXISTS "StaffTimeOff" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "type" "TimeOffType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffTimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for StaffTimeOff
CREATE INDEX IF NOT EXISTS "StaffTimeOff_userId_idx" ON "StaffTimeOff"("userId");
CREATE INDEX IF NOT EXISTS "StaffTimeOff_startDate_idx" ON "StaffTimeOff"("startDate");

-- AddForeignKey for StaffTimeOff
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StaffTimeOff_userId_fkey'
  ) THEN
    ALTER TABLE "StaffTimeOff" ADD CONSTRAINT "StaffTimeOff_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StaffTimeOff_createdById_fkey'
  ) THEN
    ALTER TABLE "StaffTimeOff" ADD CONSTRAINT "StaffTimeOff_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable ElderlyAbsence
CREATE TABLE IF NOT EXISTS "ElderlyAbsence" (
    "id" SERIAL NOT NULL,
    "elderlyId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ElderlyAbsence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for ElderlyAbsence
CREATE INDEX IF NOT EXISTS "ElderlyAbsence_elderlyId_idx" ON "ElderlyAbsence"("elderlyId");
CREATE INDEX IF NOT EXISTS "ElderlyAbsence_startDate_idx" ON "ElderlyAbsence"("startDate");

-- AddForeignKey for ElderlyAbsence
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ElderlyAbsence_elderlyId_fkey'
  ) THEN
    ALTER TABLE "ElderlyAbsence" ADD CONSTRAINT "ElderlyAbsence_elderlyId_fkey"
      FOREIGN KEY ("elderlyId") REFERENCES "Elderly"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ElderlyAbsence_createdById_fkey'
  ) THEN
    ALTER TABLE "ElderlyAbsence" ADD CONSTRAINT "ElderlyAbsence_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
