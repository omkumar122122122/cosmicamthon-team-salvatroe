// ─────────────────────────────────────────────
// Prisma select projections
// ─────────────────────────────────────────────

/** Lightweight list projection */
export const CHILD_LIST_SELECT = {
  id: true,
  childCode: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  approximateAge: true,
  gender: true,
  photo: true,
  healthStatus: true,
  currentStatus: true,
  adoptionStatus: true,
  isAdoptable: true,
  isActive: true,
  orphanageId: true,
  admissionDate: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Full detail projection */
export const CHILD_DETAIL_SELECT = {
  id: true,
  childCode: true,
  orphanageId: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  approximateAge: true,
  gender: true,
  nationality: true,
  religion: true,
  motherTongue: true,
  caste: true,
  height: true,
  weight: true,
  bloodGroup: true,
  skinTone: true,
  eyeColor: true,
  hairColor: true,
  distinguishingMarks: true,
  aadhaarNumber: true,
  birthCertNumber: true,
  photo: true,
  healthStatus: true,
  hasDisability: true,
  disabilityDetails: true,
  hasChronicCondition: true,
  chronicConditionDetails: true,
  isVaccinationComplete: true,
  currentStatus: true,
  adoptionStatus: true,
  isAdoptable: true,
  isActive: true,
  admissionDate: true,
  admissionReason: true,
  entrySource: true,
  referredBy: true,
  fatherName: true,
  fatherStatus: true,
  motherName: true,
  motherStatus: true,
  parentsMaritalStatus: true,
  familyBackground: true,
  foundLocation: true,
  foundDistrict: true,
  foundState: true,
  assignedSocialWorkerId: true,
  assignedCaseworkerId: true,
  specialNotes: true,
  internalNotes: true,
  createdAt: true,
  updatedAt: true,
  medicalHistories: true,
  healthReports: { orderBy: { reportDate: 'desc' as const }, take: 5 },
  attendanceRecords: { orderBy: { date: 'desc' as const }, take: 30 },
  educationRecords: { where: { isCurrent: true } },
  guardianHistories: { orderBy: { startDate: 'desc' as const } },
  biometricData: { where: { isActive: true } },
  documents: true,
  relationships: true,
  adoptionRecord: true,
} as const;

export const MEDICAL_HISTORY_SELECT = {
  id: true,
  childId: true,
  conditionName: true,
  severity: true,
  diagnosedDate: true,
  diagnosedBy: true,
  diagnosedAt: true,
  isCurrent: true,
  isChronicCondition: true,
  treatmentDetails: true,
  medications: true,
  allergies: true,
  resolvedDate: true,
  notes: true,
  recordedById: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const HEALTH_REPORT_SELECT = {
  id: true,
  childId: true,
  reportDate: true,
  reportedBy: true,
  facility: true,
  healthStatus: true,
  height: true,
  weight: true,
  bmi: true,
  temperature: true,
  bloodPressure: true,
  heartRate: true,
  oxygenLevel: true,
  findings: true,
  diagnosis: true,
  prescription: true,
  followUpDate: true,
  followUpNotes: true,
  vaccinationGiven: true,
  vaccinationBatch: true,
  nextVaccinationDue: true,
  reportFileUrl: true,
  notes: true,
  recordedById: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const ATTENDANCE_SELECT = {
  id: true,
  childId: true,
  date: true,
  status: true,
  checkInTime: true,
  checkOutTime: true,
  activity: true,
  remarks: true,
  markedById: true,
  isVerified: true,
  biometricVerified: true,
  faceMatchScore: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ─────────────────────────────────────────────
// Response interfaces
// ─────────────────────────────────────────────

export interface PaginatedChildren<T> {
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

export interface AttendanceStats {
  childId: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  sickLeave: number;
  attendancePercent: number;
  period: { from: string; to: string };
}

export interface FaceMatchResult {
  matched: boolean;
  childId: string | null;
  childCode: string | null;
  confidence: number;
  message: string;
}

export interface ChildDashboardStats {
  total: number;
  active: number;
  adopted: number;
  missing: number;
  adoptable: number;
  byGender: Record<string, number>;
  byHealthStatus: Record<string, number>;
  byAgeGroup: Record<string, number>;
  recentAdmissions: number;
}
