import { ChildGender, BloodGroup, HealthStatus } from '@prisma/client';

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  address?: string;
}

export interface ILegalRescueDetails {
  caseNo?: string;
  firNo?: string;
  rescueAgency?: string;
  cwcOrderDetails?: string;
}

export interface IAttendanceProfileDefaults {
  attendanceEnabled: boolean;
  totalAttendance: number;
  recognitionStatus: string;
}

export interface IRegistrationAuditContext {
  userId: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  orphanageId?: string;
}
