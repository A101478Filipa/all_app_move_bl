-- CreateTable: WoundTracking
CREATE TABLE "WoundTracking" (
    "id" SERIAL NOT NULL,
    "fallOccurrenceId" INTEGER,
    "sosOccurrenceId" INTEGER,
    "createdByUserId" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WoundTracking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WoundTracking" ADD CONSTRAINT "WoundTracking_fallOccurrenceId_fkey"
    FOREIGN KEY ("fallOccurrenceId") REFERENCES "FallOccurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WoundTracking" ADD CONSTRAINT "WoundTracking_sosOccurrenceId_fkey"
    FOREIGN KEY ("sosOccurrenceId") REFERENCES "SosOccurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WoundTracking" ADD CONSTRAINT "WoundTracking_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
