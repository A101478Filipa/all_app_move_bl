-- CreateTable
CREATE TABLE "external_access_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "calendarEventId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_visit_notes" (
    "id" SERIAL NOT NULL,
    "calendarEventId" INTEGER NOT NULL,
    "professionalName" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "recommendations" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_visit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_access_tokens_token_key" ON "external_access_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "external_access_tokens_calendarEventId_key" ON "external_access_tokens"("calendarEventId");

-- CreateIndex
CREATE INDEX "external_access_tokens_token_idx" ON "external_access_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "external_visit_notes_calendarEventId_key" ON "external_visit_notes"("calendarEventId");

-- AddForeignKey
ALTER TABLE "external_access_tokens" ADD CONSTRAINT "external_access_tokens_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_visit_notes" ADD CONSTRAINT "external_visit_notes_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
