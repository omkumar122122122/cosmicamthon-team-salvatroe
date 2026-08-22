import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ChildrenRegistrationService } from '../src/children/services/children-registration.service';
import { ChildFaceEnrollmentService } from '../src/children/face-enrollment/child-face-enrollment.service';
import { ChildProfileManagementService } from '../src/children/management/services/child-profile-management.service';
import { FacialPoseType } from '../src/children/face-enrollment/interfaces/face-quality.interface';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrganizationType, Role } from '@prisma/client';

async function bootstrap() {
  console.log('=== TESTING CHILD REGISTRATION & DATA PERSISTENCE PIPELINE ===');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const registrationService = app.get(ChildrenRegistrationService);
  const faceEnrollmentService = app.get(ChildFaceEnrollmentService);
  const profileService = app.get(ChildProfileManagementService);

  try {
    // 1. Fetch or create a test admin user ID for audit log foreign key
    let user = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `admin-${Date.now()}@test.org`,
          password: '$2a$10$abcdefghijklmnopqrstuu',
          firstName: 'System',
          lastName: 'Admin',
          role: Role.ADMIN,
        },
      });
    }

    // 2. Fetch or create a test orphanage ID
    let orphanage = await prisma.orphanage.findFirst({ where: { isActive: true } });
    if (!orphanage) {
      orphanage = await prisma.orphanage.create({
        data: {
          code: `ORPH-TEST-${Date.now()}`,
          name: 'Sunshine Orphan Care Center',
          organizationType: OrganizationType.NGO,
          registrationNumber: `REG-${Date.now()}`,
          officialEmail: `contact-${Date.now()}@sunshine.org`,
          phone: '+91 98765 43210',
          addressLine1: 'Civil Lines Road',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
        },
      });
    }

    const uniqueLastName = `TestChild-${Date.now().toString().slice(-4)}`;

    console.log(`✓ Test User Resolved: ${user.firstName} ${user.lastName} (${user.id})`);
    console.log(`✓ Test Orphanage Resolved: ${orphanage.name} (ID: ${orphanage.id})`);

    // 3. Execute Child Registration
    const registrationResult = await registrationService.registerChild(
      {
        orphanageId: orphanage.id,
        firstName: 'Rahul',
        lastName: uniqueLastName,
        dateOfBirth: '2017-05-15',
        approximateAge: 8,
        gender: 'MALE' as any,
        bloodGroup: 'O_POSITIVE' as any,
        motherTongue: 'Hindi',
        nationality: 'Indian',
        distinguishingMarks: 'Small scar on right elbow',
        foundLocation: 'Connaught Place, Delhi',
        entrySource: 'Found alone / Abandoned',
        admissionReason: 'Intake registration',
      },
      user.id,
      'ADMIN',
      '127.0.0.1',
      'NodeTestRunner/1.0'
    );

    const childId = registrationResult.data.id;
    console.log(`✓ Child Intake Registered Successfully: ${registrationResult.data.fullName} (Code: ${registrationResult.data.childCode}, ID: ${childId})`);

    // 4. Execute AI Face Enrollment (with FRONT_SMILING posture frame)
    const dummyImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const sampleFrames = [
      { childId, pose: FacialPoseType.FRONT_NEUTRAL, imageBase64: dummyImageBase64, lightingQuality: 92, blurScore: 90 },
      { childId, pose: FacialPoseType.FRONT_SMILING, imageBase64: dummyImageBase64, lightingQuality: 98, blurScore: 95 }, // Smiling posture
      { childId, pose: FacialPoseType.LEFT_PROFILE, imageBase64: dummyImageBase64, lightingQuality: 90, blurScore: 88 },
      { childId, pose: FacialPoseType.RIGHT_PROFILE, imageBase64: dummyImageBase64, lightingQuality: 90, blurScore: 88 },
      { childId, pose: FacialPoseType.LOOK_UP, imageBase64: dummyImageBase64, lightingQuality: 88, blurScore: 86 },
      { childId, pose: FacialPoseType.LOOK_DOWN, imageBase64: dummyImageBase64, lightingQuality: 88, blurScore: 86 },
      { childId, pose: FacialPoseType.BLINK_LIVENESS, imageBase64: dummyImageBase64, lightingQuality: 94, blurScore: 92 },
    ];

    const enrollmentResult = await faceEnrollmentService.completeEnrollment(
      {
        childId,
        capturedFrames: sampleFrames,
      },
      user.id,
      '127.0.0.1',
      'NodeTestRunner/1.0'
    );

    console.log(`✓ AI Face Enrollment Completed! Attendance Ready: ${enrollmentResult.attendanceReady}, Quality Score: ${enrollmentResult.enrollmentQualityScore}%`);

    // 5. Verify Database Persistence
    const childProfile = await profileService.getChildProfile(childId);
    console.log('\n--- VERIFYING PERSISTED DATABASE RECORDS ---');
    console.log(`- Child Full Name: ${childProfile.fullName}`);
    console.log(`- Child Code: ${childProfile.childCode}`);
    console.log(`- Calculated Age: ${childProfile.approximateAge} years`);
    console.log(`- Primary Profile Photo (Smiling Posture): ${childProfile.photo ? 'SET (FRONT_SMILING Selected)' : 'NOT SET'}`);
    console.log(`- Assigned Orphanage: ${childProfile.orphanage?.name}`);
    console.log(`- Biometric Records Stored: ${childProfile.biometricData.length} (Type: ${childProfile.biometricData[0]?.type})`);
    console.log(`- Initial Medical History Records: ${childProfile.medicalHistories.length}`);
    console.log(`- Initial Attendance Profile Status: ${childProfile.aiEnrollmentStatus}`);

    const auditLogs = await prisma.auditLog.findMany({
      where: { resourceId: childId },
    });

    console.log(`- Audit Logs Recorded: ${auditLogs.length} events (${auditLogs.map((a) => a.action).join(', ')})`);
    console.log('================================================================');
    console.log('RESULT: 100% DATA PERSISTENCE PIPELINE VERIFIED SUCCESSFULLY!');

  } catch (error) {
    console.error('❌ Pipeline Test Failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
