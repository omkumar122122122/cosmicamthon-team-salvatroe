-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'ORPHANAGE', 'PARENT', 'SOCIAL_WORKER', 'GUEST');

-- CreateEnum
CREATE TYPE "public"."OtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'TWO_FACTOR_AUTH', 'PASSWORD_RESET', 'SENSITIVE_ACTION');

-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "public"."MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED');

-- CreateEnum
CREATE TYPE "public"."EmploymentType" AS ENUM ('EMPLOYED_FULL_TIME', 'EMPLOYED_PART_TIME', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'UNEMPLOYED', 'RETIRED', 'STUDENT');

-- CreateEnum
CREATE TYPE "public"."IncomeRange" AS ENUM ('BELOW_10K', 'RANGE_10K_25K', 'RANGE_25K_50K', 'RANGE_50K_100K', 'ABOVE_100K');

-- CreateEnum
CREATE TYPE "public"."ParentVerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('AADHAAR_CARD', 'PAN_CARD', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'BIRTH_CERTIFICATE', 'MARRIAGE_CERTIFICATE', 'INCOME_PROOF', 'ADDRESS_PROOF', 'BANK_STATEMENT', 'ITR_DOCUMENT', 'EMPLOYMENT_LETTER', 'NOC_CERTIFICATE', 'POLICE_CLEARANCE', 'MEDICAL_CERTIFICATE', 'PHOTO_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."AddressType" AS ENUM ('PERMANENT', 'CURRENT', 'OFFICE');

-- CreateEnum
CREATE TYPE "public"."PoliceVerificationStatus" AS ENUM ('NOT_INITIATED', 'INITIATED', 'IN_PROGRESS', 'CLEARED', 'FLAGGED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."RelationshipType" AS ENUM ('SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'GRANDPARENT', 'UNCLE_AUNT', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TrustScoreEvent" AS ENUM ('PROFILE_COMPLETED', 'EMAIL_VERIFIED', 'PHONE_VERIFIED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'POLICE_CLEARED', 'POLICE_FLAGGED', 'INCOME_VERIFIED', 'ADDRESS_VERIFIED', 'INTERVIEW_PASSED', 'INTERVIEW_FAILED', 'REFERENCE_VERIFIED', 'PREVIOUS_ADOPTION', 'ACCOUNT_SUSPENDED', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."ChildGender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."ChildStatus" AS ENUM ('REGISTERED', 'ACTIVE', 'ADOPTED', 'REUNITED_WITH_FAMILY', 'TRANSFERRED', 'DECEASED', 'MISSING', 'RUNAWAY');

-- CreateEnum
CREATE TYPE "public"."AdoptionStatus" AS ENUM ('NOT_INITIATED', 'ELIGIBLE', 'UNDER_REVIEW', 'MATCHED', 'LEGAL_PROCESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "public"."HealthStatus" AS ENUM ('HEALTHY', 'UNDER_TREATMENT', 'CRITICAL', 'RECOVERING', 'CHRONIC_CONDITION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HOLIDAY', 'SICK_LEAVE');

-- CreateEnum
CREATE TYPE "public"."EducationLevel" AS ENUM ('NOT_ENROLLED', 'PRE_SCHOOL', 'PRIMARY', 'MIDDLE', 'SECONDARY', 'HIGHER_SECONDARY', 'VOCATIONAL', 'COLLEGE', 'GRADUATED', 'SPECIAL_EDUCATION');

-- CreateEnum
CREATE TYPE "public"."BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."GuardianRelation" AS ENUM ('BIOLOGICAL_PARENT', 'ADOPTIVE_PARENT', 'FOSTER_PARENT', 'GRANDPARENT', 'UNCLE_AUNT', 'SIBLING', 'LEGAL_GUARDIAN', 'ORPHANAGE_STAFF', 'SOCIAL_WORKER', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ChildDocumentType" AS ENUM ('BIRTH_CERTIFICATE', 'AADHAAR_CARD', 'SCHOOL_CERTIFICATE', 'MEDICAL_RECORD', 'VACCINATION_CARD', 'COURT_ORDER', 'SURRENDER_DEED', 'POLICE_REPORT', 'PHOTO_ID', 'RELINQUISHMENT_DEED', 'ADOPTION_ORDER', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MedicalConditionSeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."BiometricType" AS ENUM ('FINGERPRINT', 'FACE_RECOGNITION', 'IRIS_SCAN', 'VOICE_PRINT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT,
    "provider" "public"."AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "providerUserId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'GUEST',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "emailVerificationToken" TEXT,
    "emailVerificationTokenExpiry" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetTokenExpiry" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."otp_tokens" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "public"."OtpPurpose" NOT NULL,
    "userId" TEXT NOT NULL,
    "deliveredTo" TEXT NOT NULL,
    "deliveryType" TEXT NOT NULL DEFAULT 'email',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'Indian',
    "religion" TEXT,
    "maritalStatus" "public"."MaritalStatus",
    "spouseName" TEXT,
    "spouseDateOfBirth" TIMESTAMP(3),
    "spouseOccupation" TEXT,
    "alternatePhone" TEXT,
    "emergencyContact" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactRelation" TEXT,
    "occupation" TEXT,
    "employmentType" "public"."EmploymentType",
    "employerName" TEXT,
    "employerAddress" TEXT,
    "workPhone" TEXT,
    "yearsOfExperience" INTEGER,
    "annualIncome" DOUBLE PRECISION,
    "incomeRange" "public"."IncomeRange",
    "incomeVerified" BOOLEAN NOT NULL DEFAULT false,
    "houseOwnership" TEXT,
    "numberOfRooms" INTEGER,
    "hasChildRoom" BOOLEAN NOT NULL DEFAULT false,
    "hasChronicIllness" BOOLEAN NOT NULL DEFAULT false,
    "chronicIllnessDetails" TEXT,
    "hasDisability" BOOLEAN NOT NULL DEFAULT false,
    "disabilityDetails" TEXT,
    "hasHealthInsurance" BOOLEAN NOT NULL DEFAULT false,
    "preferredChildAge" TEXT,
    "preferredGender" TEXT,
    "preferredCount" INTEGER NOT NULL DEFAULT 1,
    "openToSpecialNeeds" BOOLEAN NOT NULL DEFAULT false,
    "specialNeedsDetails" TEXT,
    "adoptionMotivation" TEXT,
    "reference1Name" TEXT,
    "reference1Phone" TEXT,
    "reference1Relation" TEXT,
    "reference2Name" TEXT,
    "reference2Phone" TEXT,
    "reference2Relation" TEXT,
    "verificationStatus" "public"."ParentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationNotes" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "interviewDate" TIMESTAMP(3),
    "interviewNotes" TEXT,
    "interviewPassedAt" TIMESTAMP(3),
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "trustScoreBreakdown" JSONB,
    "lastTrustScoreUpdate" TIMESTAMP(3),
    "kycStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "kycSubmittedAt" TIMESTAMP(3),
    "kycApprovedAt" TIMESTAMP(3),
    "kycRejectionReason" TEXT,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hasAdoptedBefore" BOOLEAN NOT NULL DEFAULT false,
    "previousAdoptionDetails" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parent_addresses" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "type" "public"."AddressType" NOT NULL DEFAULT 'CURRENT',
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_members" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" "public"."RelationshipType" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "occupation" TEXT,
    "annualIncome" DOUBLE PRECISION,
    "isDependent" BOOLEAN NOT NULL DEFAULT false,
    "contactPhone" TEXT,
    "aadharNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parent_documents" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "documentType" "public"."DocumentType" NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageUrl" TEXT,
    "documentNumber" TEXT,
    "issuedBy" TEXT,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "reviewNotes" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."police_verifications" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "status" "public"."PoliceVerificationStatus" NOT NULL DEFAULT 'NOT_INITIATED',
    "applicationNumber" TEXT,
    "appliedAt" TIMESTAMP(3),
    "appliedStation" TEXT,
    "stationAddress" TEXT,
    "officerName" TEXT,
    "officerBadgeNumber" TEXT,
    "officerPhone" TEXT,
    "clearedAt" TIMESTAMP(3),
    "certificateNumber" TEXT,
    "certificateUrl" TEXT,
    "validUntil" TIMESTAMP(3),
    "flagReason" TEXT,
    "flagDetails" TEXT,
    "crimeRecordFound" BOOLEAN NOT NULL DEFAULT false,
    "crimeRecordDetails" TEXT,
    "initiatedById" TEXT,
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "lastFollowUpAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "police_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trust_score_logs" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "event" "public"."TrustScoreEvent" NOT NULL,
    "previousScore" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT,
    "performedById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_score_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."children" (
    "id" TEXT NOT NULL,
    "childCode" TEXT NOT NULL,
    "orphanageId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "approximateAge" INTEGER,
    "gender" "public"."ChildGender" NOT NULL DEFAULT 'UNKNOWN',
    "nationality" TEXT NOT NULL DEFAULT 'Indian',
    "religion" TEXT,
    "motherTongue" TEXT,
    "caste" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bloodGroup" "public"."BloodGroup" NOT NULL DEFAULT 'UNKNOWN',
    "skinTone" TEXT,
    "eyeColor" TEXT,
    "hairColor" TEXT,
    "distinguishingMarks" TEXT,
    "aadhaarNumber" TEXT,
    "birthCertNumber" TEXT,
    "photo" TEXT,
    "healthStatus" "public"."HealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "hasDisability" BOOLEAN NOT NULL DEFAULT false,
    "disabilityDetails" TEXT,
    "hasChronicCondition" BOOLEAN NOT NULL DEFAULT false,
    "chronicConditionDetails" TEXT,
    "isVaccinationComplete" BOOLEAN NOT NULL DEFAULT false,
    "currentStatus" "public"."ChildStatus" NOT NULL DEFAULT 'REGISTERED',
    "adoptionStatus" "public"."AdoptionStatus" NOT NULL DEFAULT 'NOT_INITIATED',
    "isAdoptable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admissionReason" TEXT,
    "entrySource" TEXT,
    "referredBy" TEXT,
    "fatherName" TEXT,
    "fatherStatus" TEXT,
    "motherName" TEXT,
    "motherStatus" TEXT,
    "parentsMaritalStatus" TEXT,
    "familyBackground" TEXT,
    "foundLocation" TEXT,
    "foundDistrict" TEXT,
    "foundState" TEXT,
    "assignedSocialWorkerId" TEXT,
    "assignedCaseworkerId" TEXT,
    "specialNotes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_histories" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "conditionName" TEXT NOT NULL,
    "severity" "public"."MedicalConditionSeverity" NOT NULL DEFAULT 'MILD',
    "diagnosedDate" TIMESTAMP(3),
    "diagnosedBy" TEXT,
    "diagnosedAt" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "isChronicCondition" BOOLEAN NOT NULL DEFAULT false,
    "treatmentDetails" TEXT,
    "medications" TEXT,
    "allergies" TEXT,
    "resolvedDate" TIMESTAMP(3),
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_reports" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "reportedBy" TEXT,
    "facility" TEXT,
    "healthStatus" "public"."HealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "bloodPressure" TEXT,
    "heartRate" INTEGER,
    "oxygenLevel" DOUBLE PRECISION,
    "findings" TEXT,
    "diagnosis" TEXT,
    "prescription" TEXT,
    "followUpDate" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "vaccinationGiven" TEXT,
    "vaccinationBatch" TEXT,
    "nextVaccinationDue" TIMESTAMP(3),
    "reportFileUrl" TEXT,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_records" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "activity" TEXT,
    "remarks" TEXT,
    "markedById" TEXT,
    "verifiedBy" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "biometricVerified" BOOLEAN NOT NULL DEFAULT false,
    "faceMatchScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."education_records" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "level" "public"."EducationLevel" NOT NULL DEFAULT 'NOT_ENROLLED',
    "schoolName" TEXT,
    "schoolAddress" TEXT,
    "schoolBoard" TEXT,
    "className" TEXT,
    "section" TEXT,
    "rollNumber" TEXT,
    "academicYear" TEXT,
    "enrollmentDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "attendancePercent" DOUBLE PRECISION,
    "lastGradePercent" DOUBLE PRECISION,
    "performanceNotes" TEXT,
    "teacherNotes" TEXT,
    "requiresSpecialSupport" BOOLEAN NOT NULL DEFAULT false,
    "specialSupportDetails" TEXT,
    "hasScholarship" BOOLEAN NOT NULL DEFAULT false,
    "scholarshipDetails" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."guardian_histories" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "relation" "public"."GuardianRelation" NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "aadhaarNumber" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "reasonForChange" TEXT,
    "handoverNotes" TEXT,
    "linkedParentId" TEXT,
    "courtOrderNumber" TEXT,
    "courtOrderDate" TIMESTAMP(3),
    "courtOrderUrl" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardian_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."biometric_data" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "type" "public"."BiometricType" NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedBy" TEXT,
    "faceEncodingJson" TEXT,
    "faceImageUrl" TEXT,
    "faceModelVersion" TEXT,
    "fingerprintTemplate" TEXT,
    "fingerprintFinger" TEXT,
    "templateData" TEXT,
    "deviceId" TEXT,
    "quality" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biometric_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."child_documents" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "documentType" "public"."ChildDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageUrl" TEXT,
    "documentNumber" TEXT,
    "issuedBy" TEXT,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."child_relationships" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "relatedChildId" TEXT,
    "relatedPersonName" TEXT,
    "relationship" TEXT NOT NULL,
    "notes" TEXT,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adoption_records" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "status" "public"."AdoptionStatus" NOT NULL DEFAULT 'NOT_INITIATED',
    "adoptiveParentId" TEXT,
    "eligibilityDate" TIMESTAMP(3),
    "matchedDate" TIMESTAMP(3),
    "legalProcessStart" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "cancelledDate" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "courtName" TEXT,
    "courtCaseNumber" TEXT,
    "courtOrderDate" TIMESTAMP(3),
    "courtOrderUrl" TEXT,
    "adoptionCertNumber" TEXT,
    "adoptionCertUrl" TEXT,
    "postAdoptionFollowUp1" TIMESTAMP(3),
    "postAdoptionFollowUp2" TIMESTAMP(3),
    "postAdoptionNotes" TEXT,
    "caraReferenceNumber" TEXT,
    "caraStatus" TEXT,
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adoption_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "public"."users"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "public"."users"("passwordResetToken");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "public"."users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "public"."refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_jti_key" ON "public"."refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "public"."refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "public"."refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_jti_idx" ON "public"."refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "refresh_tokens_isRevoked_idx" ON "public"."refresh_tokens"("isRevoked");

-- CreateIndex
CREATE INDEX "otp_tokens_userId_idx" ON "public"."otp_tokens"("userId");

-- CreateIndex
CREATE INDEX "otp_tokens_purpose_idx" ON "public"."otp_tokens"("purpose");

-- CreateIndex
CREATE INDEX "otp_tokens_isUsed_idx" ON "public"."otp_tokens"("isUsed");

-- CreateIndex
CREATE UNIQUE INDEX "parents_userId_key" ON "public"."parents"("userId");

-- CreateIndex
CREATE INDEX "parents_userId_idx" ON "public"."parents"("userId");

-- CreateIndex
CREATE INDEX "parents_verificationStatus_idx" ON "public"."parents"("verificationStatus");

-- CreateIndex
CREATE INDEX "parents_trustScore_idx" ON "public"."parents"("trustScore");

-- CreateIndex
CREATE INDEX "parents_kycStatus_idx" ON "public"."parents"("kycStatus");

-- CreateIndex
CREATE INDEX "parents_isActive_idx" ON "public"."parents"("isActive");

-- CreateIndex
CREATE INDEX "parent_addresses_parentId_idx" ON "public"."parent_addresses"("parentId");

-- CreateIndex
CREATE INDEX "parent_addresses_type_idx" ON "public"."parent_addresses"("type");

-- CreateIndex
CREATE INDEX "family_members_parentId_idx" ON "public"."family_members"("parentId");

-- CreateIndex
CREATE INDEX "parent_documents_parentId_idx" ON "public"."parent_documents"("parentId");

-- CreateIndex
CREATE INDEX "parent_documents_documentType_idx" ON "public"."parent_documents"("documentType");

-- CreateIndex
CREATE INDEX "parent_documents_status_idx" ON "public"."parent_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "police_verifications_parentId_key" ON "public"."police_verifications"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "police_verifications_applicationNumber_key" ON "public"."police_verifications"("applicationNumber");

-- CreateIndex
CREATE INDEX "police_verifications_parentId_idx" ON "public"."police_verifications"("parentId");

-- CreateIndex
CREATE INDEX "police_verifications_status_idx" ON "public"."police_verifications"("status");

-- CreateIndex
CREATE INDEX "trust_score_logs_parentId_idx" ON "public"."trust_score_logs"("parentId");

-- CreateIndex
CREATE INDEX "trust_score_logs_event_idx" ON "public"."trust_score_logs"("event");

-- CreateIndex
CREATE UNIQUE INDEX "children_childCode_key" ON "public"."children"("childCode");

-- CreateIndex
CREATE INDEX "children_childCode_idx" ON "public"."children"("childCode");

-- CreateIndex
CREATE INDEX "children_currentStatus_idx" ON "public"."children"("currentStatus");

-- CreateIndex
CREATE INDEX "children_adoptionStatus_idx" ON "public"."children"("adoptionStatus");

-- CreateIndex
CREATE INDEX "children_healthStatus_idx" ON "public"."children"("healthStatus");

-- CreateIndex
CREATE INDEX "children_orphanageId_idx" ON "public"."children"("orphanageId");

-- CreateIndex
CREATE INDEX "children_isActive_idx" ON "public"."children"("isActive");

-- CreateIndex
CREATE INDEX "children_isAdoptable_idx" ON "public"."children"("isAdoptable");

-- CreateIndex
CREATE INDEX "medical_histories_childId_idx" ON "public"."medical_histories"("childId");

-- CreateIndex
CREATE INDEX "medical_histories_isCurrent_idx" ON "public"."medical_histories"("isCurrent");

-- CreateIndex
CREATE INDEX "health_reports_childId_idx" ON "public"."health_reports"("childId");

-- CreateIndex
CREATE INDEX "health_reports_reportDate_idx" ON "public"."health_reports"("reportDate");

-- CreateIndex
CREATE INDEX "attendance_records_childId_idx" ON "public"."attendance_records"("childId");

-- CreateIndex
CREATE INDEX "attendance_records_date_idx" ON "public"."attendance_records"("date");

-- CreateIndex
CREATE INDEX "attendance_records_status_idx" ON "public"."attendance_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_childId_date_activity_key" ON "public"."attendance_records"("childId", "date", "activity");

-- CreateIndex
CREATE INDEX "education_records_childId_idx" ON "public"."education_records"("childId");

-- CreateIndex
CREATE INDEX "education_records_isCurrent_idx" ON "public"."education_records"("isCurrent");

-- CreateIndex
CREATE INDEX "guardian_histories_childId_idx" ON "public"."guardian_histories"("childId");

-- CreateIndex
CREATE INDEX "guardian_histories_isCurrent_idx" ON "public"."guardian_histories"("isCurrent");

-- CreateIndex
CREATE INDEX "biometric_data_childId_idx" ON "public"."biometric_data"("childId");

-- CreateIndex
CREATE INDEX "biometric_data_type_idx" ON "public"."biometric_data"("type");

-- CreateIndex
CREATE INDEX "biometric_data_isActive_idx" ON "public"."biometric_data"("isActive");

-- CreateIndex
CREATE INDEX "child_documents_childId_idx" ON "public"."child_documents"("childId");

-- CreateIndex
CREATE INDEX "child_documents_documentType_idx" ON "public"."child_documents"("documentType");

-- CreateIndex
CREATE INDEX "child_relationships_childId_idx" ON "public"."child_relationships"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "adoption_records_childId_key" ON "public"."adoption_records"("childId");

-- CreateIndex
CREATE INDEX "adoption_records_status_idx" ON "public"."adoption_records"("status");

-- CreateIndex
CREATE INDEX "adoption_records_adoptiveParentId_idx" ON "public"."adoption_records"("adoptiveParentId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."otp_tokens" ADD CONSTRAINT "otp_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parents" ADD CONSTRAINT "parents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_addresses" ADD CONSTRAINT "parent_addresses_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_members" ADD CONSTRAINT "family_members_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_documents" ADD CONSTRAINT "parent_documents_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."police_verifications" ADD CONSTRAINT "police_verifications_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trust_score_logs" ADD CONSTRAINT "trust_score_logs_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_histories" ADD CONSTRAINT "medical_histories_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_reports" ADD CONSTRAINT "health_reports_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."education_records" ADD CONSTRAINT "education_records_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."guardian_histories" ADD CONSTRAINT "guardian_histories_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."biometric_data" ADD CONSTRAINT "biometric_data_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."child_documents" ADD CONSTRAINT "child_documents_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."child_relationships" ADD CONSTRAINT "child_relationships_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adoption_records" ADD CONSTRAINT "adoption_records_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
