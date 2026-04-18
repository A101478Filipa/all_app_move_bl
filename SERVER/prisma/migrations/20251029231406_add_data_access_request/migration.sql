-- CreateEnum
CREATE TYPE "DataAccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'REVOKED');

-- CreateTable
CREATE TABLE "DataAccessRequest" (
    "id" SERIAL NOT NULL,
    "clinicianId" INTEGER NOT NULL,
    "elderlyId" INTEGER NOT NULL,
    "status" "DataAccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataAccessRequest_clinicianId_idx" ON "DataAccessRequest"("clinicianId");

-- CreateIndex
CREATE INDEX "DataAccessRequest_elderlyId_idx" ON "DataAccessRequest"("elderlyId");

-- CreateIndex
CREATE INDEX "DataAccessRequest_status_idx" ON "DataAccessRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DataAccessRequest_clinicianId_elderlyId_key" ON "DataAccessRequest"("clinicianId", "elderlyId");

-- AddForeignKey
ALTER TABLE "DataAccessRequest" ADD CONSTRAINT "DataAccessRequest_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataAccessRequest" ADD CONSTRAINT "DataAccessRequest_elderlyId_fkey" FOREIGN KEY ("elderlyId") REFERENCES "Elderly"("id") ON DELETE CASCADE ON UPDATE CASCADE;
