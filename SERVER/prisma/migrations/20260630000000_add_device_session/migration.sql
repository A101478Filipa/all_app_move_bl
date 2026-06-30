-- CreateTable
CREATE TABLE "DeviceSession" (
    "id" SERIAL NOT NULL,
    "elderlyId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "collectionType" TEXT NOT NULL,
    "collectionCode" TEXT NOT NULL,
    "trialNumber" INTEGER NOT NULL,
    "sampleRateHz" INTEGER NOT NULL DEFAULT 100,
    "sampleCount" INTEGER NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "durationSeconds" DOUBLE PRECISION NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "payload" BYTEA NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeviceSession_elderlyId_idx" ON "DeviceSession"("elderlyId");

-- CreateIndex
CREATE INDEX "DeviceSession_startedAt_idx" ON "DeviceSession"("startedAt");

-- AddForeignKey
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_elderlyId_fkey" FOREIGN KEY ("elderlyId") REFERENCES "Elderly"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
