import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const donors = await prisma.donor.findMany();
  console.log('Registered Donors in DB:');
  donors.forEach((d) => {
    console.log(`- Name: ${d.fullName} | Email: ${d.email} | Mobile: ${d.mobileNumber} | City: ${d.city}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
