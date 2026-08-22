-- Add emergency contact fields to Orphanage table (FIX-1)
ALTER TABLE "orphanages" ADD COLUMN "emergencyContactPerson" TEXT;
ALTER TABLE "orphanages" ADD COLUMN "emergencyContactMobile" TEXT;
ALTER TABLE "orphanages" ADD COLUMN "emergencyContactEmail" TEXT;
ALTER TABLE "orphanages" ADD COLUMN "emergencyContactRelationship" TEXT;

-- Add facilities JSON field (FIX-2)
ALTER TABLE "orphanages" ADD COLUMN "facilities" JSONB;

-- Add VERIFIED status to LicenseStatus enum (FIX-9)
ALTER TYPE "LicenseStatus" ADD VALUE IF NOT EXISTS 'VERIFIED';

-- Add comments for encrypted fields (FIX-3, FIX-4)
COMMENT ON COLUMN "orphanages"."bankAccountNumber" IS 'AES-256 encrypted';
COMMENT ON COLUMN "orphanages"."gstNumber" IS 'AES-256 encrypted';
COMMENT ON COLUMN "orphanages"."panNumber" IS 'AES-256 encrypted';
