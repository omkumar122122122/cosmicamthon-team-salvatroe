import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function bootstrap() {
  console.log('=== CLEARING ALL CHILD RECORDS & BIOMETRICS FROM DATABASE ===');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);

  try {
    // 1. Delete dependent records first to respect foreign key constraints
    const deletedAttendance = await prisma.attendanceRecord.deleteMany({});
    console.log(`- Deleted Attendance Records: ${deletedAttendance.count}`);

    const deletedHealth = await prisma.healthReport.deleteMany({});
    console.log(`- Deleted Health Reports: ${deletedHealth.count}`);

    const deletedMedical = await prisma.medicalHistory.deleteMany({});
    console.log(`- Deleted Medical Histories: ${deletedMedical.count}`);

    const deletedEducation = await prisma.educationRecord.deleteMany({});
    console.log(`- Deleted Education Records: ${deletedEducation.count}`);

    const deletedGuardian = await prisma.guardianHistory.deleteMany({});
    console.log(`- Deleted Guardian Histories: ${deletedGuardian.count}`);

    const deletedDocuments = await prisma.childDocument.deleteMany({});
    console.log(`- Deleted Child Documents: ${deletedDocuments.count}`);

    const deletedBiometrics = await prisma.biometricData.deleteMany({});
    console.log(`- Deleted Biometric Encodes: ${deletedBiometrics.count}`);

    const deletedAlerts = await prisma.alert.deleteMany({});
    console.log(`- Deleted Alerts: ${deletedAlerts.count}`);

    // 2. Delete all Child records
    const deletedChildren = await prisma.child.deleteMany({});
    console.log(`- Deleted Children Records: ${deletedChildren.count}`);

    console.log('================================================================');
    console.log('RESULT: DATABASE CLEANUP COMPLETED SUCCESSFULLY! 0 CHILDREN REMAIN.');

  } catch (error) {
    console.error('❌ Database Cleanup Error:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
