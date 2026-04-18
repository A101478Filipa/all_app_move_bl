-- Drop unique indexes on email columns
DROP INDEX IF EXISTS "Programmer_email_key";
DROP INDEX IF EXISTS "InstitutionAdmin_email_key";
DROP INDEX IF EXISTS "ExternalPersonnel_email_key";

-- Drop email columns from role tables
-- Note: Data has already been migrated to User.email in previous migration
ALTER TABLE "Programmer" DROP COLUMN IF EXISTS "email";
ALTER TABLE "Clinician" DROP COLUMN IF EXISTS "email";
ALTER TABLE "Caregiver" DROP COLUMN IF EXISTS "email";
ALTER TABLE "Elderly" DROP COLUMN IF EXISTS "email";
ALTER TABLE "InstitutionAdmin" DROP COLUMN IF EXISTS "email";
ALTER TABLE "ExternalPersonnel" DROP COLUMN IF EXISTS "email";
