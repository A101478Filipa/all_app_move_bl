-- Add email column to User table (nullable first)
ALTER TABLE "User" ADD COLUMN "email" TEXT;

-- Migrate emails from role tables to User table
-- For Elderly users
UPDATE "User" u
SET email = e.email
FROM "Elderly" e
WHERE u.id = e."userId" AND e.email IS NOT NULL;

-- For Caregiver users
UPDATE "User" u
SET email = c.email
FROM "Caregiver" c
WHERE u.id = c."userId" AND c.email IS NOT NULL;

-- For Clinician users
UPDATE "User" u
SET email = cl.email
FROM "Clinician" cl
WHERE u.id = cl."userId" AND cl.email IS NOT NULL;

-- For Programmer users
UPDATE "User" u
SET email = p.email
FROM "Programmer" p
WHERE u.id = p."userId" AND p.email IS NOT NULL;

-- For InstitutionAdmin users
UPDATE "User" u
SET email = ia.email
FROM "InstitutionAdmin" ia
WHERE u.id = ia."userId" AND ia.email IS NOT NULL;

-- For ExternalPersonnel users
UPDATE "User" u
SET email = ep.email
FROM "ExternalPersonnel" ep
WHERE u.id = ep."userId" AND ep.email IS NOT NULL;

-- For users without email in role tables, generate placeholder (using username@placeholder.com)
UPDATE "User"
SET email = username || '@placeholder.moveplus.local'
WHERE email IS NULL;

-- Now make email NOT NULL and UNIQUE
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Drop unique constraints from role tables
-- Programmer email unique constraint
DROP INDEX IF EXISTS "Programmer_email_key";

-- InstitutionAdmin email unique constraint
DROP INDEX IF EXISTS "InstitutionAdmin_email_key";

-- ExternalPersonnel email unique constraint
DROP INDEX IF EXISTS "ExternalPersonnel_email_key";

-- Make email fields optional in role tables (already nullable in some, but ensure all are)
ALTER TABLE "Programmer" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "InstitutionAdmin" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "ExternalPersonnel" ALTER COLUMN "email" DROP NOT NULL;

-- Recreate unique constraints where email is not null (partial unique index)
CREATE UNIQUE INDEX "Programmer_email_key" ON "Programmer"("email") WHERE "email" IS NOT NULL;
CREATE UNIQUE INDEX "InstitutionAdmin_email_key" ON "InstitutionAdmin"("email") WHERE "email" IS NOT NULL;
CREATE UNIQUE INDEX "ExternalPersonnel_email_key" ON "ExternalPersonnel"("email") WHERE "email" IS NOT NULL;
