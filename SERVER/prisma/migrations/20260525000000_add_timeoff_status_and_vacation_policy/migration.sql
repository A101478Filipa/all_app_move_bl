-- CreateEnum
CREATE TYPE "TimeOffStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- AlterTable: add status / response columns to StaffTimeOff
ALTER TABLE "StaffTimeOff"
  ADD COLUMN "status"        "TimeOffStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "respondedById" INTEGER,
  ADD COLUMN "respondedAt"   TIMESTAMP(3),
  ADD COLUMN "responseNote"  TEXT;

-- Backfill: all previously created time-offs were admin-approved
UPDATE "StaffTimeOff" SET "status" = 'APPROVED';

-- CreateTable: InstitutionVacationPolicy
CREATE TABLE "InstitutionVacationPolicy" (
    "id"                     SERIAL NOT NULL,
    "institutionId"          INTEGER NOT NULL,
    "maxVacationDaysPerYear" INTEGER NOT NULL DEFAULT 22,
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionVacationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionVacationPolicy_institutionId_key" ON "InstitutionVacationPolicy"("institutionId");

-- AddForeignKey: StaffTimeOff.respondedById → User.id
ALTER TABLE "StaffTimeOff"
  ADD CONSTRAINT "StaffTimeOff_respondedById_fkey"
  FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: InstitutionVacationPolicy.institutionId → Institution.id
ALTER TABLE "InstitutionVacationPolicy"
  ADD CONSTRAINT "InstitutionVacationPolicy_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
