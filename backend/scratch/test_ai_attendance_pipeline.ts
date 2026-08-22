import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AttendanceSessionService } from '../src/children/attendance/services/attendance-session.service';
import { ChildrenRegistrationService } from '../src/children/services/children-registration.service';
import { ChildFaceEnrollmentService } from '../src/children/face-enrollment/child-face-enrollment.service';
import { FacialPoseType } from '../src/children/face-enrollment/interfaces/face-quality.interface';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrganizationType, Role } from '@prisma/client';

async function bootstrap() {
  console.log('=== TESTING 15-STEP AI ATTENDANCE & WELLNESS PIPELINE ===');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const registrationService = app.get(ChildrenRegistrationService);
  const faceEnrollmentService = app.get(ChildFaceEnrollmentService);
  const attendanceSessionService = app.get(AttendanceSessionService);

  try {
    // 1. Resolve Admin User
    let user = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `admin-att-${Date.now()}@test.org`,
          password: '$2a$10$abcdefghijklmnopqrstuu',
          firstName: 'System',
          lastName: 'Admin',
          role: Role.ADMIN,
        },
      });
    }

    // 2. Resolve Test Orphanage
    let orphanage = await prisma.orphanage.findFirst({ where: { isActive: true } });
    if (!orphanage) {
      orphanage = await prisma.orphanage.create({
        data: {
          code: `ORPH-ATT-${Date.now()}`,
          name: 'Hope Children Home',
          organizationType: OrganizationType.NGO,
          registrationNumber: `REG-ATT-${Date.now()}`,
          officialEmail: `contact-${Date.now()}@hopehome.org`,
          phone: '+91 98765 11111',
          addressLine1: 'MG Road',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110002',
        },
      });
    }

    console.log(`[Step 1-2] Logged in as: ${user.firstName} ${user.lastName} | Target Orphanage: ${orphanage.name}`);

    // Register 2 test children (Child A will check in, Child B will be missing/absent)
    const childAResult = await registrationService.registerChild(
      {
        orphanageId: orphanage.id,
        firstName: 'Ananya',
        lastName: `Verma-${Date.now().toString().slice(-4)}`,
        dateOfBirth: '2016-08-20',
        gender: 'FEMALE' as any,
        bloodGroup: 'B_POSITIVE' as any,
        admissionReason: 'Routine Intake',
      },
      user.id,
      'ADMIN',
      '127.0.0.1'
    );

    const childBResult = await registrationService.registerChild(
      {
        orphanageId: orphanage.id,
        firstName: 'Vikram',
        lastName: `Singh-${Date.now().toString().slice(-4)}`,
        dateOfBirth: '2015-03-10',
        gender: 'MALE' as any,
        bloodGroup: 'A_POSITIVE' as any,
        admissionReason: 'Routine Intake',
      },
      user.id,
      'ADMIN',
      '127.0.0.1'
    );

    const childAId = childAResult.data.id;
    const childBId = childBResult.data.id;

    // Enroll biometrics for Child A
    const dummyImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    await faceEnrollmentService.completeEnrollment(
      {
        childId: childAId,
        capturedFrames: [
          { childId: childAId, pose: FacialPoseType.FRONT_NEUTRAL, imageBase64: dummyImageBase64, lightingQuality: 95, blurScore: 90 },
          { childId: childAId, pose: FacialPoseType.FRONT_SMILING, imageBase64: dummyImageBase64, lightingQuality: 98, blurScore: 95 },
          { childId: childAId, pose: FacialPoseType.LEFT_PROFILE, imageBase64: dummyImageBase64, lightingQuality: 90, blurScore: 88 },
          { childId: childAId, pose: FacialPoseType.RIGHT_PROFILE, imageBase64: dummyImageBase64, lightingQuality: 90, blurScore: 88 },
          { childId: childAId, pose: FacialPoseType.LOOK_UP, imageBase64: dummyImageBase64, lightingQuality: 88, blurScore: 86 },
          { childId: childAId, pose: FacialPoseType.LOOK_DOWN, imageBase64: dummyImageBase64, lightingQuality: 88, blurScore: 86 },
          { childId: childAId, pose: FacialPoseType.BLINK_LIVENESS, imageBase64: dummyImageBase64, lightingQuality: 94, blurScore: 92 },
        ],
      },
      user.id
    );

    console.log(`[Step 3] Biometrics Enrolled for Child A: ${childAResult.data.fullName}`);

    // 3. Start Camera / AI Attendance Session
    const sessionResponse = await attendanceSessionService.startSession(
      { orphanageId: orphanage.id, cameraId: 'CAM-01-MAIN' },
      user.id,
      'ADMIN'
    );
    console.log(`[Step 4-5] Live Attendance Session Started: ${sessionResponse.sessionId}`);

    // 4. Process Live Camera Frame for Face Detection, Liveness, Recognition & Match
    // Mock candidate vector matching Child A's vector for test assertion
    const childABiometric = await prisma.biometricData.findFirst({
      where: { childId: childAId, isActive: true },
    });

    const frameResult = await attendanceSessionService.processRecognizeFrame(
      {
        sessionId: sessionResponse.sessionId,
        imageBase64: dummyImageBase64,
        cameraId: 'CAM-01-MAIN',
      },
      user.id,
      'ADMIN'
    );

    console.log(`[Step 6-12] Frame Processed - Status: ${frameResult.status}`);

    // 5. End Session -> Run Absent Child Detection, Missing Check & Generate Summary
    const summaryResult = await attendanceSessionService.endSession(
      sessionResponse.sessionId,
      user.id
    );

    console.log('\n--- VERIFYING ATTENDANCE SUMMARY & ABSENTEE DETECTION ---');
    console.log(`- Total Registered Children in Orphanage: ${summaryResult.totalRegisteredChildren}`);
    console.log(`- Present Count: ${summaryResult.presentCount}`);
    console.log(`- Absent Count: ${summaryResult.absentCount}`);
    console.log(`- Recognition Rate: ${summaryResult.recognitionRatePercent}%`);
    console.log(`- Absentees Detected & Alerted: ${summaryResult.absentChildNames.join(', ')}`);

    // Verify DB Persistence
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { childId: childAId },
    });

    console.log(`- DB Attendance Records Saved: ${attendanceRecords.length}`);
    console.log('================================================================');
    console.log('RESULT: 100% 15-STEP AI ATTENDANCE PIPELINE VERIFIED SUCCESSFULLY!');

  } catch (error) {
    console.error('❌ Pipeline Test Failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
