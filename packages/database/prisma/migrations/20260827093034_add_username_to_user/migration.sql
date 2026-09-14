-- AlterTable: add a username column for login, alongside the existing email column.
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill any existing row(s) so the column can become required.
-- (Single-organizer setup: the existing account becomes "admin".)
UPDATE "User" SET "username" = 'admin' WHERE "username" IS NULL;

-- Make it required and unique, same as email.
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
