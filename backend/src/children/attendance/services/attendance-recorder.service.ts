import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceRecorderService {
  private readonly logger = new Logger(AttendanceRecorderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records a verified biometric attendance entry inside Prisma transaction.
   * Prevents multiple attendance records for the same child in the same session.
   */
  async recordPresentAttendance(params: {
    childId: string;
    sessionId: string;
    confidenceScore: number;
    staffUserId: string;
    activity?: string;
  }): Promise<{ isDuplicate: boolean; recordId?: string }> {
    const { childId, sessionId, confidenceScore, staffUserId, activity } = params;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const activityName = activity || `Session-${sessionId.substring(0, 8)}`;

    // 1. Check if child is already recorded as PRESENT today for this activity
    const existing = await this.prisma.attendanceRecord.findFirst({
      where: {
        childId,
        date: todayDate,
        activity: activityName,
      },
    });

    if (existing) {
      this.logger.debug(`Duplicate check-in ignored for child ${childId} in session ${sessionId}`);
      return { isDuplicate: true, recordId: existing.id };
    }

    // 2. Create Attendance Record in Prisma
    const record = await this.prisma.attendanceRecord.create({
      data: {
        childId,
        date: todayDate,
        status: AttendanceStatus.PRESENT,
        checkInTime: new Date(),
        activity: activityName,
        biometricVerified: true,
        isVerified: true,
        faceMatchScore: confidenceScore,
        markedById: staffUserId,
        remarks: `AI Biometric Check-in (${confidenceScore}% match)`,
      },
    });

    this.logger.log(`Recorded PRESENT attendance for child ${childId} (Score: ${confidenceScore}%)`);
    return { isDuplicate: false, recordId: record.id };
  }
}
