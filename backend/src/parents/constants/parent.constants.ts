import { DocumentType } from '../enums/parent.enums';

// ─────────────────────────────────────────────
// Trust Score Weights (must sum to 100)
// ─────────────────────────────────────────────

export const TRUST_SCORE_WEIGHTS = {
  PROFILE_COMPLETE: 15,       // all personal fields filled
  EMAIL_VERIFIED: 5,
  PHONE_VERIFIED: 5,
  INCOME_VERIFIED: 10,
  ADDRESS_VERIFIED: 10,
  POLICE_CLEARED: 20,
  DOCUMENTS_APPROVED: 20,     // per required doc — distributed
  INTERVIEW_PASSED: 10,
  REFERENCE_VERIFIED: 5,
} as const;

/** Per-event delta applied to trust score */
export const TRUST_SCORE_DELTAS: Record<string, number> = {
  PROFILE_COMPLETED: +15,
  EMAIL_VERIFIED: +5,
  PHONE_VERIFIED: +5,
  DOCUMENT_APPROVED: +5,      // per document
  DOCUMENT_REJECTED: -3,
  POLICE_CLEARED: +20,
  POLICE_FLAGGED: -25,
  INCOME_VERIFIED: +10,
  ADDRESS_VERIFIED: +10,
  INTERVIEW_PASSED: +10,
  INTERVIEW_FAILED: -10,
  REFERENCE_VERIFIED: +5,
  PREVIOUS_ADOPTION: +5,
  ACCOUNT_SUSPENDED: -50,
  MANUAL_ADJUSTMENT: 0,       // admin specifies delta directly
};

export const TRUST_SCORE_MIN = 0;
export const TRUST_SCORE_MAX = 100;

// ─────────────────────────────────────────────
// Required documents for KYC completion
// ─────────────────────────────────────────────

export const REQUIRED_DOCUMENTS: DocumentType[] = [
  DocumentType.AADHAAR_CARD,
  DocumentType.PAN_CARD,
  DocumentType.INCOME_PROOF,
  DocumentType.ADDRESS_PROOF,
  DocumentType.PHOTO_ID,
];

// ─────────────────────────────────────────────
// Allowed MIME types for document uploads
// ─────────────────────────────────────────────

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─────────────────────────────────────────────
// Document upload directory
// ─────────────────────────────────────────────

export const DOCUMENT_UPLOAD_DIR = 'uploads/parent-documents';

// ─────────────────────────────────────────────
// Audit actions for Parent module
// ─────────────────────────────────────────────

export const PARENT_AUDIT_ACTIONS = {
  PROFILE_CREATED: 'PARENT_PROFILE_CREATED',
  PROFILE_UPDATED: 'PARENT_PROFILE_UPDATED',
  PROFILE_DELETED: 'PARENT_PROFILE_DELETED',
  ADDRESS_ADDED: 'PARENT_ADDRESS_ADDED',
  ADDRESS_UPDATED: 'PARENT_ADDRESS_UPDATED',
  ADDRESS_DELETED: 'PARENT_ADDRESS_DELETED',
  FAMILY_MEMBER_ADDED: 'PARENT_FAMILY_MEMBER_ADDED',
  FAMILY_MEMBER_UPDATED: 'PARENT_FAMILY_MEMBER_UPDATED',
  FAMILY_MEMBER_DELETED: 'PARENT_FAMILY_MEMBER_DELETED',
  DOCUMENT_UPLOADED: 'PARENT_DOCUMENT_UPLOADED',
  DOCUMENT_REVIEWED: 'PARENT_DOCUMENT_REVIEWED',
  DOCUMENT_DELETED: 'PARENT_DOCUMENT_DELETED',
  POLICE_VERIFICATION_INITIATED: 'PARENT_POLICE_VERIFICATION_INITIATED',
  POLICE_VERIFICATION_UPDATED: 'PARENT_POLICE_VERIFICATION_UPDATED',
  VERIFICATION_STATUS_CHANGED: 'PARENT_VERIFICATION_STATUS_CHANGED',
  TRUST_SCORE_UPDATED: 'PARENT_TRUST_SCORE_UPDATED',
  KYC_SUBMITTED: 'PARENT_KYC_SUBMITTED',
  KYC_APPROVED: 'PARENT_KYC_APPROVED',
  KYC_REJECTED: 'PARENT_KYC_REJECTED',
  INTERVIEW_SCHEDULED: 'PARENT_INTERVIEW_SCHEDULED',
} as const;

// ─────────────────────────────────────────────
// Pagination defaults
// ─────────────────────────────────────────────

export const PARENT_PAGE_DEFAULT = 1;
export const PARENT_LIMIT_DEFAULT = 20;
export const PARENT_LIMIT_MAX = 100;
