import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';
import { ChildRegistrationNotificationService } from '../../notifications/child-registration-notification.service';

@Injectable()
export class AbsentDetectionService {
  private readonly logger = new Logger(AbsentDetectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: ChildRegistrationNotificationService
  ) {}

  /**
   * Processes absent child detection upon attendance session completion.
   * Compares all active enrolled children against checked-in attendance records for today.
   */
  async detectAndMarkAbsentees(params: {
    orphanageId: string;
    orphanageName: string;
    sessionId: string;
    checkedInChildIds: Set<string>;
    staffUserId: string;
  }): Promise<{ absentChildCount: number; absentChildNames: string[] }> {
    const { orphanageId, orphanageName, sessionId, checkedInChildIds, staffUserId } = params;

    // 1. Fetch all active enrolled children in this orphanage
    const activeChildren = await this.prisma.child.findMany({
      where: {
        orphanageId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        childCode: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!activeChildren || activeChildren.length === 0) {
      return { absentChildCount: 0, absentChildNames: [] };
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const activityName = `Session-${sessionId.substring(0, 8)}`;

    const absentChildNames: string[] = [];
    const absentRecordsData: any[] = [];

    // 2. Identify children who have not checked in
    for (const child of activeChildren) {
      if (!checkedInChildIds.has(child.id)) {
        const fullName = `${child.firstName} ${child.lastName || ''}`.trim();
        absentChildNames.push(`${fullName} (${child.childCode})`);

        absentRecordsData.push({
          childId: child.id,
          date: todayDate,
          status: AttendanceStatus.ABSENT,
          activity: activityName,
          biometricVerified: false,
          isVerified: true,
          markedById: staffUserId,
          remarks: `Auto-marked ABSENT upon session completion (${sessionId.substring(0, 8)})`,
        });
      }
    }

    // 3. Batch create ABSENT attendance records in Prisma
    if (absentRecordsData.length > 0) {
      await this.prisma.attendanceRecord.createMany({
        data: absentRecordsData,
        skipDuplicates: true,
      });

      this.logger.warn(
        `Marked ${absentRecordsData.length} active children as ABSENT in orphanage ${orphanageName}`
      );

      // 4. Send Critical Notification for Absent Children
      this.notificationService.notifyAdminsOnRegistration({
        childName: `Critical: ${absentRecordsData.length} Absent Children Detected`,
        childCode: `ABSENT-ALERT-${sessionId.substring(0, 6)}`,
        orphanageName,
        childId: 'ABSENT-SUMMARY',
      });
    }

    return {
      absentChildCount: absentChildNames.length,
      absentChildNames,
    };
  }
}
