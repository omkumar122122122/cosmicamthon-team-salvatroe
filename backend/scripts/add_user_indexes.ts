import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const statements = [
    'CREATE INDEX IF NOT EXISTS "users_email_deletedAt_idx" ON "users"("email", "deletedAt")',
    'CREATE INDEX IF NOT EXISTS "users_email_isActive_idx" ON "users"("email", "isActive")',
    'CREATE INDEX IF NOT EXISTS "users_emailVerificationToken_idx" ON "users"("emailVerificationToken")',
    'CREATE INDEX IF NOT EXISTS "users_passwordResetToken_idx" ON "users"("passwordResetToken")',
    'CREATE INDEX IF NOT EXISTS "users_loginAttempts_idx" ON "users"("loginAttempts")',
    'CREATE INDEX IF NOT EXISTS "users_lockedUntil_idx" ON "users"("lockedUntil")',
  ];

  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
    console.log('APPLIED:', sql);
  }

  console.log('User auth indexes ensured.');
}

main()
  .catch((err) => {
    console.error('Index creation failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });