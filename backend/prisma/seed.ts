import {
  PrismaClient,
  Role,
  Gender,
  MaritalStatus,
  EmploymentType,
  HouseOwnership,
  ParentVerificationStatus,
  KycStatus,
  ChildGender,
  ChildStatus,
  HealthStatus,
  BloodGroup,
  AdoptionStatus,
  OrganizationType,
  OrphanageStatus,
  OrphanageStaffRole,
  LicenseType,
  LicenseStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...\n');

  // Passwords for each test account (matching frontend dummy data)
  const adminPassword = await bcrypt.hash('admin123', 12);
  const parentPassword = await bcrypt.hash('parent123', 12);
  const orphanagePassword = await bcrypt.hash('orphanage123', 12);

  // ═══════════════════════════════════════════════════════════════
  // 1. ADMIN USER
  // ═══════════════════════════════════════════════════════════════
  console.log('👤 Creating Admin user...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@safety.gov' },
    update: {},
    create: {
      email: 'admin@safety.gov',
      password: adminPassword,
      firstName: 'Aarav',
      lastName: 'Sharma',
      role: Role.ADMIN,
      phone: '+919876543210',
      isEmailVerified: true,
      isActive: true,
      passwordChangedAt: new Date(),
    },
  });
  console.log('   ✅ Admin:', admin.email);

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin@childsafety.org' },
    update: {
      password: adminPassword,
    },
    create: {
      email: 'admin@childsafety.org',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.ADMIN,
      phone: '+919876543290',
      isEmailVerified: true,
      isActive: true,
      passwordChangedAt: new Date(),
    },
  });
  console.log('   ✅ Admin (README):', admin2.email);

  // ═══════════════════════════════════════════════════════════════
  // 2. ORPHANAGES (3 orphanages with different compliance levels)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🏠 Creating Orphanages...');

  // Orphanage 1: High Compliance (92%)
  const orphanage1 = await prisma.orphanage.upsert({
    where: { registrationNumber: 'REG-DL-2024-001' },
    update: {},
    create: {
      code: 'ORP-DL-2024-001',
      name: 'Sunshine Children Home',
      organizationType: OrganizationType.NGO,
      status: OrphanageStatus.ACTIVE,
      registrationNumber: 'REG-DL-2024-001',
      governmentLicenseNumber: 'GOV-DL-2010-54321',
      establishmentDate: new Date('2010-01-15'),
      officialEmail: 'contact@sunshineorphanage.org',
      phone: '+919876543211',
      alternativePhone: '+919876543299',
      website: 'https://sunshineorphanage.org',
      addressLine1: 'Block A, Sector 15',
      city: 'New Delhi',
      district: 'Central Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India',
      totalCapacity: 50,
      currentOccupancy: 42,
      faceRecognitionEnabled: true,
      cctvInstalled: true,
      numberOfCameras: 12,
      gpsTrackingAvailable: true,
      emergencyAlertEnabled: true,
      biometricAttendanceEnabled: true,
      bankName: 'State Bank of India',
      bankAccountNumber: '30012345678901',
      bankIfscCode: 'SBIN0001234',
      bankAccountHolder: 'Sunshine Children Home',
      gstNumber: '07AAACS1234F1Z5',
      panNumber: 'AAACS1234F',
      complianceScore: 92,
      isActive: true,
      isVerified: true,
    },
  });
  console.log('   ✅ Orphanage 1:', orphanage1.name, '- Compliance:', orphanage1.complianceScore + '%');

  // Orphanage 2: Medium Compliance (68%)
  const orphanage2 = await prisma.orphanage.upsert({
    where: { registrationNumber: 'REG-MH-2024-002' },
    update: {},
    create: {
      code: 'ORP-MH-2024-001',
      name: 'Hope Foundation Mumbai',
      organizationType: OrganizationType.TRUST,
      status: OrphanageStatus.ACTIVE,
      registrationNumber: 'REG-MH-2024-002',
      governmentLicenseNumber: 'GOV-MH-2015-12345',
      establishmentDate: new Date('2015-03-10'),
      officialEmail: 'info@hopefoundation.org',
      phone: '+912233445566',
      website: 'https://hopefoundation.org',
      addressLine1: '45 Marine Drive, Nariman Point',
      city: 'Mumbai',
      district: 'Mumbai City',
      state: 'Maharashtra',
      pincode: '400021',
      country: 'India',
      totalCapacity: 80,
      currentOccupancy: 55,
      faceRecognitionEnabled: false,
      cctvInstalled: true,
      numberOfCameras: 8,
      gpsTrackingAvailable: false,
      emergencyAlertEnabled: true,
      biometricAttendanceEnabled: false,
      bankName: 'HDFC Bank',
      bankAccountNumber: '50012345678902',
      bankIfscCode: 'HDFC0001234',
      bankAccountHolder: 'Hope Foundation Trust',
      complianceScore: 68,
      isActive: true,
      isVerified: true,
    },
  });
  console.log('   ✅ Orphanage 2:', orphanage2.name, '- Compliance:', orphanage2.complianceScore + '%');

  // Orphanage 3: Low Compliance (45%)
  const orphanage3 = await prisma.orphanage.upsert({
    where: { registrationNumber: 'REG-KA-2024-003' },
    update: {},
    create: {
      code: 'ORP-KA-2024-001',
      name: 'Little Angels Bangalore',
      organizationType: OrganizationType.SOCIETY,
      status: OrphanageStatus.ACTIVE,
      registrationNumber: 'REG-KA-2024-003',
      governmentLicenseNumber: 'GOV-KA-2018-67890',
      establishmentDate: new Date('2018-08-20'),
      officialEmail: 'angels@littleangels.org',
      phone: '+918012345678',
      addressLine1: '123 MG Road, Koramangala',
      city: 'Bangalore',
      district: 'Bangalore Urban',
      state: 'Karnataka',
      pincode: '560034',
      country: 'India',
      totalCapacity: 30,
      currentOccupancy: 18,
      faceRecognitionEnabled: false,
      cctvInstalled: false,
      numberOfCameras: 0,
      gpsTrackingAvailable: false,
      emergencyAlertEnabled: false,
      biometricAttendanceEnabled: false,
      complianceScore: 45,
      isActive: true,
      isVerified: false,
    },
  });
  console.log('   ✅ Orphanage 3:', orphanage3.name, '- Compliance:', orphanage3.complianceScore + '%');

  // ═══════════════════════════════════════════════════════════════
  // 3. ORPHANAGE USERS & STAFF LINKS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n👥 Creating Orphanage Staff...');

  const orphanageUser1 = await prisma.user.upsert({
    where: { email: 'orphanage@example.com' },
    update: {},
    create: {
      email: 'orphanage@example.com',
      password: orphanagePassword,
      firstName: 'Rohan',
      lastName: 'Verma',
      role: Role.ORPHANAGE,
      phone: '+919876540003',
      isEmailVerified: true,
      isActive: true,
      passwordChangedAt: new Date(),
    },
  });

  const staff1 = await prisma.orphanageStaff.findFirst({
    where: { orphanageId: orphanage1.id, userId: orphanageUser1.id },
  });
  if (!staff1) {
    await prisma.orphanageStaff.create({
      data: {
        orphanageId: orphanage1.id,
        userId: orphanageUser1.id,
        role: OrphanageStaffRole.ADMINISTRATOR,
        designation: 'Director',
        employeeId: 'SUN-DIR-001',
        joiningDate: new Date('2010-01-15'),
        isActive: true,
      },
    });
  }
  console.log('   ✅ Staff 1:', orphanageUser1.email, '→', orphanage1.name);

  const readmeOrphanageUser = await prisma.user.upsert({
    where: { email: 'orphanage@childsafety.org' },
    update: {
      password: orphanagePassword,
    },
    create: {
      email: 'orphanage@childsafety.org',
      password: orphanagePassword,
      firstName: 'Orphanage',
      lastName: 'Caregiver',
      role: Role.ORPHANAGE,
      phone: '+919876543291',
      isEmailVerified: true,
      isActive: true,
      passwordChangedAt: new Date(),
    },
  });

  const staffReadme = await prisma.orphanageStaff.findFirst({
    where: { orphanageId: orphanage1.id, userId: readmeOrphanageUser.id },
  });
  if (!staffReadme) {
    await prisma.orphanageStaff.create({
      data: {
        orphanageId: orphanage1.id,
        userId: readmeOrphanageUser.id,
        role: OrphanageStaffRole.ADMINISTRATOR,
        designation: 'Administrator',
        employeeId: 'SUN-ADM-999',
        joiningDate: new Date('2024-01-01'),
        isActive: true,
      },
    });
  }
  console.log('   ✅ Staff (README):', readmeOrphanageUser.email, '→', orphanage1.name);

  const orphanageUser2 = await prisma.user.upsert({
    where: { email: 'manager@hopefoundation.org' },
    update: {},
    create: {
      email: 'manager@hopefoundation.org',
      password: orphanagePassword,
      firstName: 'Priya',
      lastName: 'Sharma',
      role: Role.ORPHANAGE,
      phone: '+919876543221',
      isEmailVerified: true,
      isActive: true,
      passwordChangedAt: new Date(),
    },
  });

  const staff2 = await prisma.orphanageStaff.findFirst({
    where: { orphanageId: orphanage2.id, userId: orphanageUser2.id },
  });
  if (!staff2) {
    await prisma.orphanageStaff.create({
      data: {
        orphanageId: orphanage2.id,
        userId: orphanageUser2.id,
        role: OrphanageStaffRole.ADMINISTRATOR,
        designation: 'Operations Manager',
        employeeId: 'HOPE-MGR-001',
        joiningDate: new Date('2015-03-10'),
        isActive: true,
      },
    });
  }
  console.log('   ✅ Staff 2:', orphanageUser2.email, '→', orphanage2.name);

  // ═══════════════════════════════════════════════════════════════
  // 4. ORPHANAGE LICENSES (KYC Documents)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📄 Creating Orphanage Licenses...');

  await prisma.orphanageLicense.upsert({
    where: {
      orphanageId_licenseType: {
        orphanageId: orphanage1.id,
        licenseType: LicenseType.REGISTRATION_CERTIFICATE,
      },
    },
    update: {},
    create: {
      orphanageId: orphanage1.id,
      licenseType: LicenseType.REGISTRATION_CERTIFICATE,
      licenseNumber: 'REG-DL-2024-001',
      issuingAuthority: 'Directorate of Women & Child Development, Delhi',
      issuedDate: new Date('2010-01-15'),
      expiryDate: new Date('2030-01-15'),
      status: LicenseStatus.VALID,
      documentUrl: '/uploads/licenses/reg-cert-001.pdf',
      storagePath: './uploads/licenses/reg-cert-001.pdf',
    },
  });

  await prisma.orphanageLicense.upsert({
    where: {
      orphanageId_licenseType: {
        orphanageId: orphanage1.id,
        licenseType: LicenseType.NGO_CERTIFICATE,
      },
    },
    update: {},
    create: {
      orphanageId: orphanage1.id,
      licenseType: LicenseType.NGO_CERTIFICATE,
      licenseNumber: 'NGO-DL-2010-001',
      issuingAuthority: 'Ministry of Home Affairs',
      issuedDate: new Date('2010-02-01'),
      status: LicenseStatus.VALID,
      documentUrl: '/uploads/licenses/ngo-cert-001.pdf',
      storagePath: './uploads/licenses/ngo-cert-001.pdf',
    },
  });

  await prisma.orphanageLicense.upsert({
    where: {
      orphanageId_licenseType: {
        orphanageId: orphanage1.id,
        licenseType: LicenseType.GOVERNMENT_LICENSE,
      },
    },
    update: {},
    create: {
      orphanageId: orphanage1.id,
      licenseType: LicenseType.GOVERNMENT_LICENSE,
      licenseNumber: 'GOV-DL-2010-54321',
      issuingAuthority: 'Delhi Government',
      issuedDate: new Date('2010-03-01'),
      expiryDate: new Date('2025-03-01'),
      status: LicenseStatus.VALID,
      documentUrl: '/uploads/licenses/gov-license-001.pdf',
      storagePath: './uploads/licenses/gov-license-001.pdf',
    },
  });
  console.log('   ✅ 3 licenses created for', orphanage1.name);

  await prisma.orphanageLicense.upsert({
    where: {
      orphanageId_licenseType: {
        orphanageId: orphanage2.id,
        licenseType: LicenseType.REGISTRATION_CERTIFICATE,
      },
    },
    update: {},
    create: {
      orphanageId: orphanage2.id,
      licenseType: LicenseType.REGISTRATION_CERTIFICATE,
      licenseNumber: 'REG-MH-2024-002',
      issuingAuthority: 'Commissioner of Women & Child Welfare, Maharashtra',
      issuedDate: new Date('2015-03-10'),
      status: LicenseStatus.VALID,
      documentUrl: '/uploads/licenses/reg-cert-002.pdf',
      storagePath: './uploads/licenses/reg-cert-002.pdf',
    },
  });
  console.log('   ✅ 1 license created for', orphanage2.name);

  // ═══════════════════════════════════════════════════════════════
  // 5. PARENT USER & PROFILE
  // ═══════════════════════════════════════════════════════════════
  console.log('\n👨‍👩‍👧 Creating Parent user...');

  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: {
      email: 'parent@example.com',
      password: parentPassword,
      firstName: 'Meera',
      lastName: 'Nair',
      role: Role.PARENT,
      phone: '+919876540004',
      isEmailVerified: true,
      isActive: true,
      passwordChangedAt: new Date(),
    },
  });

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      userId: parentUser.id,
      dateOfBirth: new Date('1985-05-15'),
      gender: Gender.MALE,
      nationality: 'Indian',
      religion: 'Hindu',
      maritalStatus: MaritalStatus.MARRIED,
      spouseName: 'Neha Patel',
      occupation: 'Software Engineer',
      employmentType: EmploymentType.EMPLOYED_FULL_TIME,
      employerName: 'TCS Limited',
      annualIncome: 1200000,
      houseOwnership: HouseOwnership.OWNED,
      numberOfRooms: 3,
      verificationStatus: ParentVerificationStatus.APPROVED,
      trustScore: 85,
      isProfileComplete: true,
    },
  });
  console.log('   ✅ Parent:', parentUser.email);

  const readmeParentUser = await prisma.user.upsert({
    where: { email: 'parent@childsafety.org' },
    update: {
      password: parentPassword,
    },
    create: {
      email: 'parent@childsafety.org',
      password: parentPassword,
      firstName: 'Parent',
      lastName: 'User',
      role: Role.PARENT,
      phone: '+919876543292',
      isEmailVerified: true,
      isActive: true,
      passwordChangedAt: new Date(),
    },
  });

  const readmeParent = await prisma.parent.upsert({
    where: { userId: readmeParentUser.id },
    update: {
      kycStatus: KycStatus.APPROVED,
      verificationStatus: ParentVerificationStatus.APPROVED,
    },
    create: {
      userId: readmeParentUser.id,
      dateOfBirth: new Date('1990-01-01'),
      gender: Gender.FEMALE,
      nationality: 'Indian',
      religion: 'Hindu',
      maritalStatus: MaritalStatus.MARRIED,
      spouseName: 'Spouse User',
      occupation: 'Professional',
      employmentType: EmploymentType.EMPLOYED_FULL_TIME,
      employerName: 'Company',
      annualIncome: 1000000,
      houseOwnership: HouseOwnership.OWNED,
      numberOfRooms: 3,
      verificationStatus: ParentVerificationStatus.APPROVED,
      trustScore: 90,
      isProfileComplete: true,
      kycStatus: KycStatus.APPROVED,
    },
  });
  console.log('   ✅ Parent (README):', readmeParentUser.email);

  // ═══════════════════════════════════════════════════════════════
  // 6. CHILDREN (Sample children in different orphanages)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n👧👦 Creating Children...');

  const child1 = await prisma.child.upsert({
    where: { childCode: 'CHILD-SUN-001' },
    update: {},
    create: {
      childCode: 'CHILD-SUN-001',
      firstName: 'Aarav',
      lastName: 'Kumar',
      dateOfBirth: new Date('2015-06-10'),
      gender: ChildGender.MALE,
      bloodGroup: BloodGroup.O_POSITIVE,
      orphanageId: orphanage1.id,
      currentStatus: ChildStatus.ACTIVE,
      healthStatus: HealthStatus.HEALTHY,
      admissionDate: new Date('2016-01-15'),
      isAdoptable: true,
    },
  });

  const child2 = await prisma.child.upsert({
    where: { childCode: 'CHILD-SUN-002' },
    update: {},
    create: {
      childCode: 'CHILD-SUN-002',
      firstName: 'Priya',
      lastName: 'Sharma',
      dateOfBirth: new Date('2016-03-20'),
      gender: ChildGender.FEMALE,
      bloodGroup: BloodGroup.A_POSITIVE,
      orphanageId: orphanage1.id,
      currentStatus: ChildStatus.ACTIVE,
      healthStatus: HealthStatus.HEALTHY,
      admissionDate: new Date('2017-02-10'),
      isAdoptable: true,
    },
  });

  const child3 = await prisma.child.upsert({
    where: { childCode: 'CHILD-HOPE-001' },
    update: {},
    create: {
      childCode: 'CHILD-HOPE-001',
      firstName: 'Rohan',
      lastName: 'Verma',
      dateOfBirth: new Date('2014-11-05'),
      gender: ChildGender.MALE,
      bloodGroup: BloodGroup.B_POSITIVE,
      orphanageId: orphanage2.id,
      currentStatus: ChildStatus.ACTIVE,
      healthStatus: HealthStatus.UNDER_TREATMENT,
      admissionDate: new Date('2015-06-01'),
      isAdoptable: true,
    },
  });
  console.log('   ✅ 3 children created');

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('═'.repeat(60));
  console.log('\n📊 Summary:');
  console.log('   • Users:      5 (1 Admin, 2 Orphanage Staff, 1 Parent, 1 Guest)');
  console.log('   • Orphanages: 3 (High/Medium/Low compliance)');
  console.log('   • Licenses:   5 KYC documents');
  console.log('   • Children:   3 registered');
  console.log('\n🔐 Test Accounts:');
  console.log('   ┌──────────────────────────────────────────────────────────────┐');
  console.log('   │ Role         Email                          Password         │');
  console.log('   ├──────────────────────────────────────────────────────────────┤');
  console.log('   │ ADMIN        admin@safety.gov               admin123         │');
  console.log('   │ ORPHANAGE    orphanage@example.com          orphanage123     │');
  console.log('   │ ORPHANAGE    manager@hopefoundation.org     orphanage123     │');
  console.log('   │ PARENT       parent@example.com             parent123        │');
  console.log('   └──────────────────────────────────────────────────────────────┘');
  console.log('\n🏠 Orphanages Created:');
  console.log(`   1. ${orphanage1.name} (${orphanage1.city}) - ${orphanage1.complianceScore}% compliance`);
  console.log(`   2. ${orphanage2.name} (${orphanage2.city}) - ${orphanage2.complianceScore}% compliance`);
  console.log(`   3. ${orphanage3.name} (${orphanage3.city}) - ${orphanage3.complianceScore}% compliance`);
  console.log('\n💡 Next Steps:');
  console.log('   1. Run: npm run start:dev (in backend/)');
  console.log('   2. Run: npm run dev (in frontend/)');
  console.log('   3. Login with any test account above');
  console.log('   4. Explore the Orphanages module!');
  console.log('\n🎉 Happy Testing!\n');
}

main()
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

