import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB Migration for Donor module...');

  try {
    // 1. Add DONOR to Role enum in Postgres
    console.log('Adding DONOR to Role enum in PostgreSQL...');
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DONOR';`);
    console.log('Successfully added DONOR to Role enum.');
  } catch (err: any) {
    console.log('Enum update note:', err.message);
  }

  try {
    // 2. Create donors table if not exists
    console.log('Creating donors table if not exists...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "donors" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "fullName" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "mobileNumber" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "donors_email_key" ON "donors"("email");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "donors_userId_key" ON "donors"("userId");
    `);

    console.log('Successfully verified donors table.');
  } catch (err: any) {
    console.error('Error creating donors table:', err.message);
  }

  try {
    // 3. Create donations table if not exists
    console.log('Creating donations table if not exists...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "donations" (
        "id" TEXT NOT NULL,
        "donorId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "category" TEXT NOT NULL,
        "paymentMethod" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'COMPLETED',
        "transactionId" TEXT NOT NULL,
        "message" TEXT,
        "orphanageId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "donations_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "donations_donorId_idx" ON "donations"("donorId");
    `);

    console.log('Successfully verified donations table.');
  } catch (err: any) {
    console.error('Error creating donations table:', err.message);
  }

  console.log('DB Migration complete.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
