-- Align the existing visit_requests table with the current Prisma model.
-- Earlier migrations created an older requestedDate/requestedTime shape; the
-- application now uses requestId, visitDate, visitTime, and workflow metadata.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'VisitRequestStatus' AND e.enumlabel = 'RESCHEDULED'
  ) THEN
    ALTER TYPE "public"."VisitRequestStatus" ADD VALUE 'RESCHEDULED';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'RiskLevel' AND e.enumlabel = 'VERY_LOW'
  ) THEN
    ALTER TYPE "public"."RiskLevel" ADD VALUE 'VERY_LOW';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'RiskLevel' AND e.enumlabel = 'CRITICAL'
  ) THEN
    ALTER TYPE "public"."RiskLevel" ADD VALUE 'CRITICAL';
  END IF;
END $$;

ALTER TABLE "public"."visit_requests"
  ADD COLUMN IF NOT EXISTS "requestId" TEXT,
  ADD COLUMN IF NOT EXISTS "visitDate" DATE,
  ADD COLUMN IF NOT EXISTS "visitTime" TEXT,
  ADD COLUMN IF NOT EXISTS "purpose" TEXT,
  ADD COLUMN IF NOT EXISTS "reason" TEXT,
  ADD COLUMN IF NOT EXISTS "adoptionTimeline" TEXT,
  ADD COLUMN IF NOT EXISTS "visitorsCount" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "relationshipOfVisitors" TEXT,
  ADD COLUMN IF NOT EXISTS "specialRequirements" TEXT,
  ADD COLUMN IF NOT EXISTS "familyBackground" TEXT,
  ADD COLUMN IF NOT EXISTS "riskLevel" "public"."RiskLevel" NOT NULL DEFAULT 'LOW',
  ADD COLUMN IF NOT EXISTS "trustScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "faceMatch" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "documentAuthenticity" TEXT,
  ADD COLUMN IF NOT EXISTS "behaviourPrediction" TEXT,
  ADD COLUMN IF NOT EXISTS "adoptionReadiness" TEXT,
  ADD COLUMN IF NOT EXISTS "recommendation" TEXT,
  ADD COLUMN IF NOT EXISTS "verification" JSONB,
  ADD COLUMN IF NOT EXISTS "meetingRoom" TEXT,
  ADD COLUMN IF NOT EXISTS "assignedStaff" TEXT,
  ADD COLUMN IF NOT EXISTS "qrStatus" TEXT NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS "qrCode" TEXT,
  ADD COLUMN IF NOT EXISTS "checkInTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "checkOutTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "expectedArrivalTime" TEXT,
  ADD COLUMN IF NOT EXISTS "uploadedDocuments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "missingDocuments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectionComments" TEXT,
  ADD COLUMN IF NOT EXISTS "originalVisitDate" DATE,
  ADD COLUMN IF NOT EXISTS "originalVisitTime" TEXT,
  ADD COLUMN IF NOT EXISTS "rescheduleReason" TEXT,
  ADD COLUMN IF NOT EXISTS "rescheduleCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "postVisitFeedback" JSONB,
  ADD COLUMN IF NOT EXISTS "parentNotified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "notifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "instructions" TEXT,
  ADD COLUMN IF NOT EXISTS "agreedToRules" BOOLEAN NOT NULL DEFAULT false;

DO $$
DECLARE
  has_requested_date BOOLEAN;
  has_requested_time BOOLEAN;
  has_confirmed_time BOOLEAN;
  has_visit_notes BOOLEAN;
  visit_date_expr TEXT;
  visit_time_expr TEXT;
  meeting_room_expr TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'visit_requests' AND column_name = 'requestedDate'
  ) INTO has_requested_date;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'visit_requests' AND column_name = 'requestedTime'
  ) INTO has_requested_time;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'visit_requests' AND column_name = 'confirmedTime'
  ) INTO has_confirmed_time;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'visit_requests' AND column_name = 'visitNotes'
  ) INTO has_visit_notes;

  visit_date_expr := CASE
    WHEN has_requested_date THEN 'COALESCE("visitDate", "requestedDate"::DATE, CURRENT_DATE)'
    ELSE 'COALESCE("visitDate", CURRENT_DATE)'
  END;

  visit_time_expr := CASE
    WHEN has_requested_time AND has_confirmed_time THEN 'COALESCE("visitTime", "requestedTime", "confirmedTime", ''10:00'')'
    WHEN has_requested_time THEN 'COALESCE("visitTime", "requestedTime", ''10:00'')'
    WHEN has_confirmed_time THEN 'COALESCE("visitTime", "confirmedTime", ''10:00'')'
    ELSE 'COALESCE("visitTime", ''10:00'')'
  END;

  meeting_room_expr := CASE
    WHEN has_visit_notes THEN 'COALESCE("meetingRoom", "visitNotes")'
    ELSE '"meetingRoom"'
  END;

  EXECUTE format(
    'UPDATE "public"."visit_requests"
     SET
       "visitDate" = %s,
       "visitTime" = %s,
       "purpose" = COALESCE("purpose", ''Adoption Inquiry''),
       "meetingRoom" = %s,
       "requestId" = COALESCE(
         "requestId",
         ''VR-'' || to_char(COALESCE("createdAt", CURRENT_TIMESTAMP), ''YYMM'') || ''-'' || substr(replace("id", ''-'', ''''), 1, 8)
       )',
    visit_date_expr,
    visit_time_expr,
    meeting_room_expr
  );
END $$;

ALTER TABLE "public"."visit_requests"
  ALTER COLUMN "requestId" SET NOT NULL,
  ALTER COLUMN "visitDate" SET NOT NULL,
  ALTER COLUMN "visitTime" SET NOT NULL,
  ALTER COLUMN "purpose" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "visit_requests_requestId_key"
  ON "public"."visit_requests"("requestId");

CREATE INDEX IF NOT EXISTS "visit_requests_orphanageId_status_idx"
  ON "public"."visit_requests"("orphanageId", "status");

CREATE INDEX IF NOT EXISTS "visit_requests_orphanageId_visitDate_idx"
  ON "public"."visit_requests"("orphanageId", "visitDate");

CREATE INDEX IF NOT EXISTS "visit_requests_parentId_status_idx"
  ON "public"."visit_requests"("parentId", "status");

CREATE INDEX IF NOT EXISTS "visit_requests_visitDate_idx"
  ON "public"."visit_requests"("visitDate");

CREATE INDEX IF NOT EXISTS "visit_requests_createdAt_idx"
  ON "public"."visit_requests"("createdAt");

CREATE INDEX IF NOT EXISTS "visit_requests_riskLevel_idx"
  ON "public"."visit_requests"("riskLevel");
