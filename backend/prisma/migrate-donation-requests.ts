import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running DonationRequest migration...');

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DonationRequestStatus') THEN
        CREATE TYPE "DonationRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED');
      END IF;
    END $$;
  `);
  console.log('✔ Enum DonationRequestStatus ensured');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "donation_requests" (
      "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
      "donorId"         TEXT        NOT NULL,
      "orphanageId"     TEXT        NOT NULL,
      "donationType"    TEXT        NOT NULL,
      "quantity"        INTEGER     NOT NULL DEFAULT 1,
      "preferredDate"   TIMESTAMPTZ NOT NULL,
      "preferredTime"   TEXT        NOT NULL,
      "message"         TEXT,
      "status"          "DonationRequestStatus" NOT NULL DEFAULT 'PENDING',
      "rejectionReason" TEXT,
      "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CONSTRAINT "donation_requests_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "donation_requests_donorId_fkey"
        FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE
    );
  `);
  console.log('✔ Table donation_requests ensured');

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "donation_requests_donorId_idx"
      ON "donation_requests"("donorId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "donation_requests_orphanageId_idx"
      ON "donation_requests"("orphanageId");
  `);
  console.log('✔ Indexes on donation_requests created');

  console.log('✅ DonationRequest migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
