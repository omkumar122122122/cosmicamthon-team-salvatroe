/*
  Warnings:

  - The `fatherStatus` column on the `children` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `motherStatus` column on the `children` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `parentsMaritalStatus` column on the `children` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `aadharNumber` on the `family_members` table. All the data in the column will be lost.
  - The `gender` column on the `family_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `reference1Name` on the `parents` table. All the data in the column will be lost.
  - You are about to drop the column `reference1Phone` on the `parents` table. All the data in the column will be lost.
  - You are about to drop the column `reference1Relation` on the `parents` table. All the data in the column will be lost.
  - You are about to drop the column `reference2Name` on the `parents` table. All the data in the column will be lost.
  - You are about to drop the column `reference2Phone` on the `parents` table. All the data in the column will be lost.
  - You are about to drop the column `reference2Relation` on the `parents` table. All the data in the column will be lost.
  - The `gender` column on the `parents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `houseOwnership` column on the `parents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `preferredGender` column on the `parents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `kycStatus` column on the `parents` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "public"."MessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "public"."KycStatus" AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."HouseOwnership" AS ENUM ('OWNED', 'RENTED', 'LEASED', 'FAMILY_OWNED');

-- CreateEnum
CREATE TYPE "public"."GenderPreference" AS ENUM ('MALE', 'FEMALE', 'ANY');

-- CreateEnum
CREATE TYPE "public"."ChildRelationshipType" AS ENUM ('SIBLING', 'TWIN', 'HALF_SIBLING', 'COUSIN', 'STEP_SIBLING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ParentStatus" AS ENUM ('ALIVE', 'DECEASED', 'UNKNOWN', 'ABANDONED');

-- CreateEnum
CREATE TYPE "public"."OrganizationType" AS ENUM ('NGO', 'GOVERNMENT', 'TRUST', 'SOCIETY', 'PRIVATE', 'RELIGIOUS');

-- CreateEnum
CREATE TYPE "public"."OrphanageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_INSPECTION', 'LICENSE_EXPIRED', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."OrphanageStaffRole" AS ENUM ('ADMINISTRATOR', 'CARETAKER', 'TEACHER', 'MEDICAL_STAFF', 'SECURITY_GUARD', 'COUNSELOR', 'SOCIAL_WORKER', 'VOLUNTEER', 'ACCOUNTANT', 'COOK', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LicenseType" AS ENUM ('REGISTRATION_CERTIFICATE', 'GOVERNMENT_LICENSE', 'NGO_CERTIFICATE', 'ADOPTION_AGENCY_LICENSE', 'CHILDCARE_LICENSE', 'FIRE_SAFETY_NOC', 'HEALTH_SAFETY_NOC', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LicenseStatus" AS ENUM ('VALID', 'EXPIRED', 'UNDER_RENEWAL', 'REVOKED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."VisitRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."VisitType" AS ENUM ('INITIAL_ASSESSMENT', 'REGULAR_VISIT', 'PRE_ADOPTION_VISIT', 'POST_ADOPTION_VISIT', 'WELFARE_CHECK', 'SUPERVISED');

-- CreateEnum
CREATE TYPE "public"."WelfareSessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'MISSED');

-- CreateEnum
CREATE TYPE "public"."WelfareSessionOutcome" AS ENUM ('NORMAL', 'CONCERN_RAISED', 'ESCALATED', 'FOLLOW_UP_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."CaseAssignmentStatus" AS ENUM ('ACTIVE', 'CLOSED', 'TRANSFERRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('ADOPTION_STATUS_CHANGED', 'VISIT_REQUEST_UPDATE', 'DOCUMENT_REVIEW_RESULT', 'POLICE_VERIFICATION_UPDATE', 'KYC_STATUS_CHANGED', 'TRUST_SCORE_UPDATED', 'WELFARE_SESSION_REMINDER', 'HEALTH_CHECKUP_DUE', 'VACCINATION_DUE', 'ALERT_RAISED', 'ACCOUNT_STATUS_CHANGED', 'SYSTEM_ANNOUNCEMENT', 'AI_SESSION_SCHEDULED', 'DOCUMENT_EXPIRY_WARNING');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('CHILD_MISSING', 'CHILD_RUNAWAY', 'HEALTH_CRITICAL', 'AI_RISK_SPIKE', 'LOW_ATTENDANCE', 'WELFARE_SESSION_OVERDUE', 'DOCUMENT_EXPIRED', 'LICENSE_EXPIRED', 'SYSTEM_ANOMALY', 'UNAUTHORIZED_ACCESS', 'ADOPTION_BLOCKED', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'FALSE_ALARM');

-- CreateEnum
CREATE TYPE "public"."AISessionType" AS ENUM ('WELFARE_CHAT', 'RISK_ASSESSMENT', 'INTERVIEW', 'COUNSELING_SUPPORT', 'SAHAYAK_QUERY');

-- CreateEnum
CREATE TYPE "public"."AISessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."AIProvider" AS ENUM ('OPENAI_GPT4', 'GOOGLE_GEMINI', 'AWS_BEDROCK', 'AZURE_OPENAI', 'LOCAL_MODEL');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('ATTENDANCE', 'ADOPTION_PIPELINE', 'HEALTH_SUMMARY', 'TRUST_SCORE_HISTORY', 'AI_SESSION_SUMMARY', 'RISK_ANALYSIS', 'MONTHLY_COMPLIANCE', 'POLICE_VERIFICATION', 'DOCUMENT_STATUS', 'WELFARE_SESSION');

-- CreateEnum
CREATE TYPE "public"."ReportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV', 'JSON');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('QUEUED', 'GENERATING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "public"."TrustScoreEvent" ADD VALUE 'VISIT_COMPLETED';

-- DropIndex
DROP INDEX "public"."refresh_tokens_jti_idx";

-- DropIndex
DROP INDEX "public"."refresh_tokens_token_idx";

-- DropIndex
DROP INDEX "public"."users_email_idx";

-- AlterTable
ALTER TABLE "public"."attendance_records" ADD COLUMN     "verifiedById" TEXT;

-- AlterTable
ALTER TABLE "public"."audit_logs" ADD COLUMN     "resourceId" TEXT;

-- AlterTable
ALTER TABLE "public"."children" DROP COLUMN "fatherStatus",
ADD COLUMN     "fatherStatus" "public"."ParentStatus",
DROP COLUMN "motherStatus",
ADD COLUMN     "motherStatus" "public"."ParentStatus",
DROP COLUMN "parentsMaritalStatus",
ADD COLUMN     "parentsMaritalStatus" "public"."MaritalStatus";

-- AlterTable
ALTER TABLE "public"."family_members" DROP COLUMN "aadharNumber",
ADD COLUMN     "aadhaarNumber" TEXT,
DROP COLUMN "gender",
ADD COLUMN     "gender" "public"."Gender";

-- AlterTable
ALTER TABLE "public"."parents" DROP COLUMN "reference1Name",
DROP COLUMN "reference1Phone",
DROP COLUMN "reference1Relation",
DROP COLUMN "reference2Name",
DROP COLUMN "reference2Phone",
DROP COLUMN "reference2Relation",
DROP COLUMN "gender",
ADD COLUMN     "gender" "public"."Gender",
DROP COLUMN "houseOwnership",
ADD COLUMN     "houseOwnership" "public"."HouseOwnership",
DROP COLUMN "preferredGender",
ADD COLUMN     "preferredGender" "public"."GenderPreference",
DROP COLUMN "kycStatus",
ADD COLUMN     "kycStatus" "public"."KycStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "public"."orphanages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationType" "public"."OrganizationType" NOT NULL,
    "status" "public"."OrphanageStatus" NOT NULL DEFAULT 'ACTIVE',
    "registrationNumber" TEXT NOT NULL,
    "governmentLicenseNumber" TEXT,
    "establishmentDate" TIMESTAMP(3),
    "officialEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternativePhone" TEXT,
    "website" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "totalCapacity" INTEGER NOT NULL DEFAULT 0,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "faceRecognitionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cctvInstalled" BOOLEAN NOT NULL DEFAULT false,
    "numberOfCameras" INTEGER NOT NULL DEFAULT 0,
    "gpsTrackingAvailable" BOOLEAN NOT NULL DEFAULT false,
    "emergencyAlertEnabled" BOOLEAN NOT NULL DEFAULT false,
    "biometricAttendanceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankIfscCode" TEXT,
    "bankAccountHolder" TEXT,
    "complianceScore" INTEGER NOT NULL DEFAULT 0,
    "lastInspectionDate" TIMESTAMP(3),
    "nextInspectionDue" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "orphanages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orphanage_staff" (
    "id" TEXT NOT NULL,
    "orphanageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."OrphanageStaffRole" NOT NULL DEFAULT 'OTHER',
    "designation" TEXT,
    "employeeId" TEXT,
    "joiningDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orphanage_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orphanage_licenses" (
    "id" TEXT NOT NULL,
    "orphanageId" TEXT NOT NULL,
    "licenseType" "public"."LicenseType" NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "issuingAuthority" TEXT NOT NULL,
    "status" "public"."LicenseStatus" NOT NULL DEFAULT 'PENDING',
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "renewedDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "storagePath" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orphanage_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parent_references" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "email" TEXT,
    "occupation" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_worker_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "supervisorId" TEXT,
    "qualification" TEXT,
    "specialization" TEXT,
    "yearsOfExperience" INTEGER,
    "licenseNumber" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "maxCaseLoad" INTEGER NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_worker_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."case_assignments" (
    "id" TEXT NOT NULL,
    "socialWorkerProfileId" TEXT NOT NULL,
    "childId" TEXT,
    "parentId" TEXT,
    "status" "public"."CaseAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."visit_requests" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "childId" TEXT,
    "orphanageId" TEXT,
    "visitType" "public"."VisitType" NOT NULL DEFAULT 'REGULAR_VISIT',
    "status" "public"."VisitRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "requestedTime" TEXT,
    "confirmedDate" TIMESTAMP(3),
    "confirmedTime" TEXT,
    "duration" INTEGER,
    "adoptionRecordId" TEXT,
    "reviewedById" TEXT,
    "approvalNotes" TEXT,
    "rejectionReason" TEXT,
    "visitSupervisorId" TEXT,
    "visitNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "noShowReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."welfare_sessions" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "visitRequestId" TEXT,
    "conductedById" TEXT,
    "aiSessionId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "conductedAt" TIMESTAMP(3),
    "status" "public"."WelfareSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "outcome" "public"."WelfareSessionOutcome",
    "sessionNotes" TEXT,
    "concernDetails" TEXT,
    "escalationNotes" TEXT,
    "actionItems" TEXT,
    "nextSessionDue" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "durationMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "welfare_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveryStatus" TEXT,
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" TEXT NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "type" "public"."AlertType" NOT NULL,
    "status" "public"."AlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "details" TEXT,
    "childId" TEXT,
    "parentId" TEXT,
    "orphanageId" TEXT,
    "createdById" TEXT,
    "resolvedById" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "isAutoGenerated" BOOLEAN NOT NULL DEFAULT false,
    "sourceService" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_sessions" (
    "id" TEXT NOT NULL,
    "sessionType" "public"."AISessionType" NOT NULL,
    "status" "public"."AISessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "provider" "public"."AIProvider" NOT NULL DEFAULT 'OPENAI_GPT4',
    "childId" TEXT,
    "initiatedById" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "totalTokensUsed" INTEGER,
    "estimatedCostUsd" DOUBLE PRECISION,
    "summary" TEXT,
    "riskLevelDetected" "public"."RiskLevel",
    "confidenceScore" DOUBLE PRECISION,
    "modelVersion" TEXT,
    "sessionConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_conversation_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "public"."MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "sentimentScore" DOUBLE PRECISION,
    "detectedTopics" JSONB,
    "flaggedContent" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_risk_scores" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "riskLevel" "public"."RiskLevel" NOT NULL,
    "score" INTEGER NOT NULL,
    "attendanceScore" INTEGER,
    "healthScore" INTEGER,
    "welfareScore" INTEGER,
    "guardianScore" INTEGER,
    "adoptionScore" INTEGER,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isComputedBySystem" BOOLEAN NOT NULL DEFAULT true,
    "computedById" TEXT,
    "modelVersion" TEXT,
    "notes" TEXT,
    "alertTriggered" BOOLEAN NOT NULL DEFAULT false,
    "alertId" TEXT,

    CONSTRAINT "ai_risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_exports" (
    "id" TEXT NOT NULL,
    "reportType" "public"."ReportType" NOT NULL,
    "format" "public"."ReportFormat" NOT NULL DEFAULT 'PDF',
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'QUEUED',
    "requestedById" TEXT,
    "filters" JSONB,
    "fileName" TEXT,
    "storagePath" TEXT,
    "storageUrl" TEXT,
    "fileSizeBytes" INTEGER,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "description" TEXT,
    "group" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orphanages_code_key" ON "public"."orphanages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "orphanages_registrationNumber_key" ON "public"."orphanages"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orphanages_governmentLicenseNumber_key" ON "public"."orphanages"("governmentLicenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orphanages_officialEmail_key" ON "public"."orphanages"("officialEmail");

-- CreateIndex
CREATE INDEX "orphanages_status_idx" ON "public"."orphanages"("status");

-- CreateIndex
CREATE INDEX "orphanages_state_idx" ON "public"."orphanages"("state");

-- CreateIndex
CREATE INDEX "orphanages_city_idx" ON "public"."orphanages"("city");

-- CreateIndex
CREATE INDEX "orphanages_isActive_idx" ON "public"."orphanages"("isActive");

-- CreateIndex
CREATE INDEX "orphanages_isVerified_idx" ON "public"."orphanages"("isVerified");

-- CreateIndex
CREATE INDEX "orphanage_staff_orphanageId_idx" ON "public"."orphanage_staff"("orphanageId");

-- CreateIndex
CREATE INDEX "orphanage_staff_userId_idx" ON "public"."orphanage_staff"("userId");

-- CreateIndex
CREATE INDEX "orphanage_staff_isActive_idx" ON "public"."orphanage_staff"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "orphanage_staff_orphanageId_userId_key" ON "public"."orphanage_staff"("orphanageId", "userId");

-- CreateIndex
CREATE INDEX "orphanage_licenses_orphanageId_idx" ON "public"."orphanage_licenses"("orphanageId");

-- CreateIndex
CREATE INDEX "orphanage_licenses_status_idx" ON "public"."orphanage_licenses"("status");

-- CreateIndex
CREATE INDEX "orphanage_licenses_expiryDate_idx" ON "public"."orphanage_licenses"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "orphanage_licenses_orphanageId_licenseType_key" ON "public"."orphanage_licenses"("orphanageId", "licenseType");

-- CreateIndex
CREATE INDEX "parent_references_parentId_idx" ON "public"."parent_references"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "social_worker_profiles_userId_key" ON "public"."social_worker_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "social_worker_profiles_employeeId_key" ON "public"."social_worker_profiles"("employeeId");

-- CreateIndex
CREATE INDEX "social_worker_profiles_userId_idx" ON "public"."social_worker_profiles"("userId");

-- CreateIndex
CREATE INDEX "social_worker_profiles_isActive_idx" ON "public"."social_worker_profiles"("isActive");

-- CreateIndex
CREATE INDEX "social_worker_profiles_supervisorId_idx" ON "public"."social_worker_profiles"("supervisorId");

-- CreateIndex
CREATE INDEX "case_assignments_socialWorkerProfileId_idx" ON "public"."case_assignments"("socialWorkerProfileId");

-- CreateIndex
CREATE INDEX "case_assignments_childId_idx" ON "public"."case_assignments"("childId");

-- CreateIndex
CREATE INDEX "case_assignments_parentId_idx" ON "public"."case_assignments"("parentId");

-- CreateIndex
CREATE INDEX "case_assignments_status_idx" ON "public"."case_assignments"("status");

-- CreateIndex
CREATE INDEX "case_assignments_socialWorkerProfileId_childId_status_idx" ON "public"."case_assignments"("socialWorkerProfileId", "childId", "status");

-- CreateIndex
CREATE INDEX "visit_requests_parentId_idx" ON "public"."visit_requests"("parentId");

-- CreateIndex
CREATE INDEX "visit_requests_childId_idx" ON "public"."visit_requests"("childId");

-- CreateIndex
CREATE INDEX "visit_requests_orphanageId_idx" ON "public"."visit_requests"("orphanageId");

-- CreateIndex
CREATE INDEX "visit_requests_status_idx" ON "public"."visit_requests"("status");

-- CreateIndex
CREATE INDEX "visit_requests_requestedDate_idx" ON "public"."visit_requests"("requestedDate");

-- CreateIndex
CREATE INDEX "visit_requests_orphanageId_confirmedDate_idx" ON "public"."visit_requests"("orphanageId", "confirmedDate");

-- CreateIndex
CREATE INDEX "visit_requests_parentId_status_idx" ON "public"."visit_requests"("parentId", "status");

-- CreateIndex
CREATE INDEX "welfare_sessions_childId_idx" ON "public"."welfare_sessions"("childId");

-- CreateIndex
CREATE INDEX "welfare_sessions_conductedById_idx" ON "public"."welfare_sessions"("conductedById");

-- CreateIndex
CREATE INDEX "welfare_sessions_status_idx" ON "public"."welfare_sessions"("status");

-- CreateIndex
CREATE INDEX "welfare_sessions_scheduledAt_idx" ON "public"."welfare_sessions"("scheduledAt");

-- CreateIndex
CREATE INDEX "welfare_sessions_nextSessionDue_idx" ON "public"."welfare_sessions"("nextSessionDue");

-- CreateIndex
CREATE INDEX "welfare_sessions_childId_scheduledAt_idx" ON "public"."welfare_sessions"("childId", "scheduledAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "public"."notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "public"."notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "public"."notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "public"."notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "public"."notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "public"."alerts"("severity");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "public"."alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "public"."alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_childId_idx" ON "public"."alerts"("childId");

-- CreateIndex
CREATE INDEX "alerts_orphanageId_idx" ON "public"."alerts"("orphanageId");

-- CreateIndex
CREATE INDEX "alerts_createdAt_idx" ON "public"."alerts"("createdAt");

-- CreateIndex
CREATE INDEX "alerts_status_severity_idx" ON "public"."alerts"("status", "severity");

-- CreateIndex
CREATE INDEX "alerts_childId_status_idx" ON "public"."alerts"("childId", "status");

-- CreateIndex
CREATE INDEX "ai_sessions_childId_idx" ON "public"."ai_sessions"("childId");

-- CreateIndex
CREATE INDEX "ai_sessions_initiatedById_idx" ON "public"."ai_sessions"("initiatedById");

-- CreateIndex
CREATE INDEX "ai_sessions_sessionType_idx" ON "public"."ai_sessions"("sessionType");

-- CreateIndex
CREATE INDEX "ai_sessions_status_idx" ON "public"."ai_sessions"("status");

-- CreateIndex
CREATE INDEX "ai_sessions_scheduledAt_idx" ON "public"."ai_sessions"("scheduledAt");

-- CreateIndex
CREATE INDEX "ai_conversation_messages_sessionId_idx" ON "public"."ai_conversation_messages"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_conversation_messages_sessionId_sequence_key" ON "public"."ai_conversation_messages"("sessionId", "sequence");

-- CreateIndex
CREATE INDEX "ai_risk_scores_childId_idx" ON "public"."ai_risk_scores"("childId");

-- CreateIndex
CREATE INDEX "ai_risk_scores_riskLevel_idx" ON "public"."ai_risk_scores"("riskLevel");

-- CreateIndex
CREATE INDEX "ai_risk_scores_computedAt_idx" ON "public"."ai_risk_scores"("computedAt");

-- CreateIndex
CREATE INDEX "ai_risk_scores_childId_computedAt_idx" ON "public"."ai_risk_scores"("childId", "computedAt");

-- CreateIndex
CREATE INDEX "ai_risk_scores_riskLevel_computedAt_idx" ON "public"."ai_risk_scores"("riskLevel", "computedAt");

-- CreateIndex
CREATE INDEX "report_exports_requestedById_idx" ON "public"."report_exports"("requestedById");

-- CreateIndex
CREATE INDEX "report_exports_reportType_idx" ON "public"."report_exports"("reportType");

-- CreateIndex
CREATE INDEX "report_exports_status_idx" ON "public"."report_exports"("status");

-- CreateIndex
CREATE INDEX "report_exports_createdAt_idx" ON "public"."report_exports"("createdAt");

-- CreateIndex
CREATE INDEX "report_exports_expiresAt_idx" ON "public"."report_exports"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "public"."system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_group_idx" ON "public"."system_settings"("group");

-- CreateIndex
CREATE INDEX "system_settings_isPublic_idx" ON "public"."system_settings"("isPublic");

-- CreateIndex
CREATE INDEX "adoption_records_completedDate_idx" ON "public"."adoption_records"("completedDate");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_idx" ON "public"."audit_logs"("resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_success_idx" ON "public"."audit_logs"("success");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "public"."audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "child_relationships_relatedChildId_idx" ON "public"."child_relationships"("relatedChildId");

-- CreateIndex
CREATE INDEX "children_deletedAt_idx" ON "public"."children"("deletedAt");

-- CreateIndex
CREATE INDEX "children_admissionDate_idx" ON "public"."children"("admissionDate");

-- CreateIndex
CREATE INDEX "children_assignedSocialWorkerId_idx" ON "public"."children"("assignedSocialWorkerId");

-- CreateIndex
CREATE INDEX "children_assignedCaseworkerId_idx" ON "public"."children"("assignedCaseworkerId");

-- CreateIndex
CREATE INDEX "children_orphanageId_isActive_idx" ON "public"."children"("orphanageId", "isActive");

-- CreateIndex
CREATE INDEX "children_orphanageId_currentStatus_idx" ON "public"."children"("orphanageId", "currentStatus");

-- CreateIndex
CREATE INDEX "guardian_histories_linkedParentId_idx" ON "public"."guardian_histories"("linkedParentId");

-- CreateIndex
CREATE INDEX "health_reports_healthStatus_idx" ON "public"."health_reports"("healthStatus");

-- CreateIndex
CREATE INDEX "medical_histories_severity_idx" ON "public"."medical_histories"("severity");

-- CreateIndex
CREATE INDEX "otp_tokens_expiresAt_idx" ON "public"."otp_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "otp_tokens_userId_purpose_idx" ON "public"."otp_tokens"("userId", "purpose");

-- CreateIndex
CREATE INDEX "otp_tokens_userId_purpose_isUsed_idx" ON "public"."otp_tokens"("userId", "purpose", "isUsed");

-- CreateIndex
CREATE INDEX "parent_addresses_isPrimary_idx" ON "public"."parent_addresses"("isPrimary");

-- CreateIndex
CREATE INDEX "parent_documents_expiryDate_idx" ON "public"."parent_documents"("expiryDate");

-- CreateIndex
CREATE INDEX "parents_kycStatus_idx" ON "public"."parents"("kycStatus");

-- CreateIndex
CREATE INDEX "parents_deletedAt_idx" ON "public"."parents"("deletedAt");

-- CreateIndex
CREATE INDEX "police_verifications_nextFollowUpAt_idx" ON "public"."police_verifications"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_isRevoked_idx" ON "public"."refresh_tokens"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "public"."refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "trust_score_logs_createdAt_idx" ON "public"."trust_score_logs"("createdAt");

-- CreateIndex
CREATE INDEX "trust_score_logs_parentId_createdAt_idx" ON "public"."trust_score_logs"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "public"."users"("deletedAt");

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orphanage_staff" ADD CONSTRAINT "orphanage_staff_orphanageId_fkey" FOREIGN KEY ("orphanageId") REFERENCES "public"."orphanages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orphanage_staff" ADD CONSTRAINT "orphanage_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orphanage_licenses" ADD CONSTRAINT "orphanage_licenses_orphanageId_fkey" FOREIGN KEY ("orphanageId") REFERENCES "public"."orphanages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parents" ADD CONSTRAINT "parents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_references" ADD CONSTRAINT "parent_references_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parent_documents" ADD CONSTRAINT "parent_documents_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."police_verifications" ADD CONSTRAINT "police_verifications_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."police_verifications" ADD CONSTRAINT "police_verifications_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trust_score_logs" ADD CONSTRAINT "trust_score_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."children" ADD CONSTRAINT "children_orphanageId_fkey" FOREIGN KEY ("orphanageId") REFERENCES "public"."orphanages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."children" ADD CONSTRAINT "children_assignedSocialWorkerId_fkey" FOREIGN KEY ("assignedSocialWorkerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."children" ADD CONSTRAINT "children_assignedCaseworkerId_fkey" FOREIGN KEY ("assignedCaseworkerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_histories" ADD CONSTRAINT "medical_histories_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_reports" ADD CONSTRAINT "health_reports_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."education_records" ADD CONSTRAINT "education_records_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."guardian_histories" ADD CONSTRAINT "guardian_histories_linkedParentId_fkey" FOREIGN KEY ("linkedParentId") REFERENCES "public"."parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."guardian_histories" ADD CONSTRAINT "guardian_histories_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."biometric_data" ADD CONSTRAINT "biometric_data_capturedBy_fkey" FOREIGN KEY ("capturedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."child_documents" ADD CONSTRAINT "child_documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."child_documents" ADD CONSTRAINT "child_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."child_relationships" ADD CONSTRAINT "child_relationships_relatedChildId_fkey" FOREIGN KEY ("relatedChildId") REFERENCES "public"."children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."child_relationships" ADD CONSTRAINT "child_relationships_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adoption_records" ADD CONSTRAINT "adoption_records_adoptiveParentId_fkey" FOREIGN KEY ("adoptiveParentId") REFERENCES "public"."parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adoption_records" ADD CONSTRAINT "adoption_records_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_worker_profiles" ADD CONSTRAINT "social_worker_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_worker_profiles" ADD CONSTRAINT "social_worker_profiles_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "public"."social_worker_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."case_assignments" ADD CONSTRAINT "case_assignments_socialWorkerProfileId_fkey" FOREIGN KEY ("socialWorkerProfileId") REFERENCES "public"."social_worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."case_assignments" ADD CONSTRAINT "case_assignments_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."case_assignments" ADD CONSTRAINT "case_assignments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visit_requests" ADD CONSTRAINT "visit_requests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visit_requests" ADD CONSTRAINT "visit_requests_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visit_requests" ADD CONSTRAINT "visit_requests_orphanageId_fkey" FOREIGN KEY ("orphanageId") REFERENCES "public"."orphanages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visit_requests" ADD CONSTRAINT "visit_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visit_requests" ADD CONSTRAINT "visit_requests_visitSupervisorId_fkey" FOREIGN KEY ("visitSupervisorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."welfare_sessions" ADD CONSTRAINT "welfare_sessions_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."welfare_sessions" ADD CONSTRAINT "welfare_sessions_visitRequestId_fkey" FOREIGN KEY ("visitRequestId") REFERENCES "public"."visit_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."welfare_sessions" ADD CONSTRAINT "welfare_sessions_conductedById_fkey" FOREIGN KEY ("conductedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."welfare_sessions" ADD CONSTRAINT "welfare_sessions_aiSessionId_fkey" FOREIGN KEY ("aiSessionId") REFERENCES "public"."ai_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_orphanageId_fkey" FOREIGN KEY ("orphanageId") REFERENCES "public"."orphanages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_sessions" ADD CONSTRAINT "ai_sessions_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_sessions" ADD CONSTRAINT "ai_sessions_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_conversation_messages" ADD CONSTRAINT "ai_conversation_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."ai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_risk_scores" ADD CONSTRAINT "ai_risk_scores_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_risk_scores" ADD CONSTRAINT "ai_risk_scores_computedById_fkey" FOREIGN KEY ("computedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_risk_scores" ADD CONSTRAINT "ai_risk_scores_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "public"."alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_exports" ADD CONSTRAINT "report_exports_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."system_settings" ADD CONSTRAINT "system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
