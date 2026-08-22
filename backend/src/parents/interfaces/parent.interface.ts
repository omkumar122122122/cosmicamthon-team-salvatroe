import {
  MaritalStatus, EmploymentType, IncomeRange,
  ParentVerificationStatus, TrustScoreEvent,
  DocumentType, DocumentStatus, AddressType,
  PoliceVerificationStatus, RelationshipType,
} from '../enums/parent.enums';

// ─────────────────────────────────────────────
// Safe DB select projections
// ─────────────────────────────────────────────

/** Fields returned on list queries (lightweight) */
export const PARENT_LIST_SELECT = {
  id: true,
  userId: true,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      isEmailVerified: true,
      isActive: true,
    },
  },
  occupation: true,
  employmentType: true,
  annualIncome: true,
  incomeRange: true,
  maritalStatus: true,
  verificationStatus: true,
  trustScore: true,
  kycStatus: true,
  isProfileComplete: true,
  isActive: true,
  preferredChildAge: true,
  preferredGender: true,
  openToSpecialNeeds: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Full detail projection for single-record fetches */
export const PARENT_DETAIL_SELECT = {
  id: true,
  userId: true,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      createdAt: true,
    },
  },
  // Personal
  dateOfBirth: true,
  gender: true,
  nationality: true,
  religion: true,
  maritalStatus: true,
  spouseName: true,
  spouseDateOfBirth: true,
  spouseOccupation: true,
  alternatePhone: true,
  emergencyContact: true,
  emergencyContactName: true,
  emergencyContactRelation: true,
  // Occupation
  occupation: true,
  employmentType: true,
  employerName: true,
  employerAddress: true,
  workPhone: true,
  yearsOfExperience: true,
  annualIncome: true,
  incomeRange: true,
  incomeVerified: true,
  // Housing
  houseOwnership: true,
  numberOfRooms: true,
  hasChildRoom: true,
  // Health
  hasChronicIllness: true,
  chronicIllnessDetails: true,
  hasDisability: true,
  disabilityDetails: true,
  hasHealthInsurance: true,
  // Adoption Preferences
  preferredChildAge: true,
  preferredGender: true,
  preferredCount: true,
  openToSpecialNeeds: true,
  specialNeedsDetails: true,
  adoptionMotivation: true,
  // References
  reference1Name: true,
  reference1Phone: true,
  reference1Relation: true,
  reference2Name: true,
  reference2Phone: true,
  reference2Relation: true,
  // Verification
  verificationStatus: true,
  verificationNotes: true,
  verifiedAt: true,
  rejectionReason: true,
  interviewDate: true,
  interviewNotes: true,
  interviewPassedAt: true,
  // Trust / KYC
  trustScore: true,
  trustScoreBreakdown: true,
  lastTrustScoreUpdate: true,
  kycStatus: true,
  kycSubmittedAt: true,
  kycApprovedAt: true,
  kycRejectionReason: true,
  // Flags
  isProfileComplete: true,
  isActive: true,
  hasAdoptedBefore: true,
  previousAdoptionDetails: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
  // Relations
  addresses: true,
  familyMembers: true,
  documents: {
    select: {
      id: true,
      documentType: true,
      status: true,
      originalName: true,
      mimeType: true,
      fileSize: true,
      storageUrl: true,
      documentNumber: true,
      issuedBy: true,
      issuedDate: true,
      expiryDate: true,
      reviewedAt: true,
      rejectionReason: true,
      reviewNotes: true,
      isRequired: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  policeVerification: true,
} as const;

// ─────────────────────────────────────────────
// Response shape interfaces
// ─────────────────────────────────────────────

export interface PaginatedParents<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface TrustScoreBreakdown {
  profile: number;
  emailVerified: number;
  phoneVerified: number;
  documentsApproved: number;
  incomeVerified: number;
  addressVerified: number;
  policeCleared: number;
  interviewPassed: number;
  total: number;
}

export interface UploadedFileInfo {
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  storageUrl?: string;
}
