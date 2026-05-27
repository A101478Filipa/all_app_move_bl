-- AlterTable: Add password reset fields to User
ALTER TABLE "User" ADD COLUMN "passwordResetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpiry" TIMESTAMP(3);

-- AlterTable: Make email nullable and add phone/utenteId to Invitation
ALTER TABLE "invitations" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "invitations" ADD COLUMN "phone" TEXT;
ALTER TABLE "invitations" ADD COLUMN "utenteId" TEXT;

-- CreateIndex: Add indexes for new invitation identifier fields
CREATE INDEX "invitations_phone_idx" ON "invitations"("phone");
CREATE INDEX "invitations_utenteId_idx" ON "invitations"("utenteId");
