export enum AttendanceSessionStatusState {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IAttendanceSessionState {
  sessionId: string;
  orphanageId: string;
  orphanageName: string;
  startedByUserId: string;
  cameraId: string;
  status: AttendanceSessionStatusState;
  startTime: Date;
  endTime?: Date;
  pausedTime?: Date;
  totalRegisteredChildren: number;
  presentCount: number;
  absentCount: number;
  unknownFaceCount: number;
  checkedInChildIds: Set<string>;
}

export interface IUnknownFaceEvent {
  id: string;
  sessionId: string;
  orphanageId: string;
  cameraId: string;
  snapshotUrl?: string;
  confidenceScore: number;
  timestamp: Date;
}

export interface IAttendanceSummaryReport {
  sessionId: string;
  orphanageId: string;
  orphanageName: string;
  totalRegisteredChildren: number;
  presentCount: number;
  absentCount: number;
  recognitionRatePercent: number;
  unknownFaceCount: number;
  durationMinutes: number;
  completedAt: Date;
  absentChildNames: string[];
}
