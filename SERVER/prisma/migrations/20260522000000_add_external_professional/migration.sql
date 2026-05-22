-- CreateTable
CREATE TABLE "ExternalProfessional" (
    "id" SERIAL NOT NULL,
    "institutionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalProfessional_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExternalProfessional" ADD CONSTRAINT "ExternalProfessional_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN "externalProfessionalId" INTEGER;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_externalProfessionalId_fkey" FOREIGN KEY ("externalProfessionalId") REFERENCES "ExternalProfessional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
