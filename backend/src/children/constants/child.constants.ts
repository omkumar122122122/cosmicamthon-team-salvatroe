import { ChildDocumentType } from '../enums/child.enums';

// ─────────────────────────────────────────────
// Child code generation
// ─────────────────────────────────────────────

export const CHILD_CODE_PREFIX = 'CHD';

// ─────────────────────────────────────────────
// Required documents for a complete child profile
// ─────────────────────────────────────────────

export const REQUIRED_CHILD_DOCUMENTS: ChildDocumentType[] = [
  ChildDocumentType.BIRTH_CERTIFICATE,
  ChildDocumentType.PHOTO_ID,
];

// ─────────────────────────────────────────────
// File upload
// ─────────────────────────────────────────────

export const CHILD_DOCUMENT_UPLOAD_DIR = 'uploads/child-documents';
export const CHILD_PHOTO_UPLOAD_DIR = 'uploads/child-photos';
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PHOTO_SIZE_BYTES = 3 * 1024 * 1024;    // 3 MB

// ─────────────────────────────────────────────
// Face recognition
// ─────────────────────────────────────────────

/** Minimum confidence score to accept a face match (0.0–1.0) */
export const FACE_MATCH_THRESHOLD = 0.75;
/** Face encoding vector dimension (dlib 128-d model) */
export const FACE_ENCODING_DIMENSION = 128;

// ─────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────

export const DEFAULT_ATTENDANCE_ACTIVITY = 'general';
/** Minimum attendance % before a welfare alert is raised */
export const ATTENDANCE_ALERT_THRESHOLD = 75;

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

export const CHILD_PAGE_DEFAULT = 1;
export const CHILD_LIMIT_DEFAULT = 20;
export const CHILD_LIMIT_MAX = 100;

// ─────────────────────────────────────────────
// Audit actions
// ─────────────────────────────────────────────

export const CHILD_AUDIT_ACTIONS = {
  CHILD_CREATED: 'CHILD_CREATED',
  CHILD_UPDATED: 'CHILD_UPDATED',
  CHILD_DELETED: 'CHILD_DELETED',
  STATUS_CHANGED: 'CHILD_STATUS_CHANGED',
  ADOPTION_STATUS_CHANGED: 'CHILD_ADOPTION_STATUS_CHANGED',
  MEDICAL_HISTORY_ADDED: 'CHILD_MEDICAL_HISTORY_ADDED',
  HEALTH_REPORT_ADDED: 'CHILD_HEALTH_REPORT_ADDED',
  ATTENDANCE_MARKED: 'CHILD_ATTENDANCE_MARKED',
  ATTENDANCE_BULK_MARKED: 'CHILD_ATTENDANCE_BULK_MARKED',
  EDUCATION_RECORD_ADDED: 'CHILD_EDUCATION_RECORD_ADDED',
  GUARDIAN_CHANGED: 'CHILD_GUARDIAN_CHANGED',
  BIOMETRIC_REGISTERED: 'CHILD_BIOMETRIC_REGISTERED',
  DOCUMENT_UPLOADED: 'CHILD_DOCUMENT_UPLOADED',
  DOCUMENT_VERIFIED: 'CHILD_DOCUMENT_VERIFIED',
  FACE_MATCH_ATTEMPTED: 'CHILD_FACE_MATCH_ATTEMPTED',
  ADOPTION_INITIATED: 'CHILD_ADOPTION_INITIATED',
  ADOPTION_COMPLETED: 'CHILD_ADOPTION_COMPLETED',
} as const;
