-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('ADMIN', 'ORPHANAGE');

-- AlterEnum
ALTER TYPE "OrphanageStaffRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE "OrphanageStaffRole" ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE "OrphanageStaffRole" ADD VALUE IF NOT EXISTS 'MODERATOR';
ALTER TYPE "OrphanageStaffRole" ADD VALUE IF NOT EXISTS 'GOVERNMENT_OFFICER';
ALTER TYPE "OrphanageStaffRole" ADD VALUE IF NOT EXISTS 'DOCTOR';
ALTER TYPE "OrphanageStaffRole" ADD VALUE IF NOT EXISTS 'NURSE';
ALTER TYPE "OrphanageStaffRole" ADD VALUE IF NOT EXISTS 'CLEANER';

-- AlterTable
ALTER TABLE "orphanage_staff" ADD COLUMN "staffType" "StaffType" NOT NULL DEFAULT 'ORPHANAGE';
ALTER TABLE "orphanage_staff" ADD COLUMN "createdBy" TEXT;
ALTER TABLE "orphanage_staff" ALTER COLUMN "orphanageId" DROP NOT NULL;

-- Data Migration Rule
-- Mark staffType = ORPHANAGE where orphanageId IS NOT NULL
UPDATE "orphanage_staff" SET "staffType" = 'ORPHANAGE' WHERE "orphanageId" IS NOT NULL;

-- Mark staffType = ADMIN where orphanageId IS NULL
UPDATE "orphanage_staff" SET "staffType" = 'ADMIN' WHERE "orphanageId" IS NULL;

-- CreateIndex
CREATE INDEX "orphanage_staff_staffType_idx" ON "orphanage_staff"("staffType");
