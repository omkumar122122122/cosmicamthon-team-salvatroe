import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "DonationRequestStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';`
  );
  console.log('✅ CANCELLED enum value added to DonationRequestStatus');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
