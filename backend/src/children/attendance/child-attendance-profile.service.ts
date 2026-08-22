import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IAttendanceProfileDefaults } from '../interfaces/child-registration.interface';

@Injectable()
export class ChildAttendanceProfileService {
  private readonly logger = new Logger(ChildAttendanceProfileService.name);

  /**
   * Returns default attendance profile structure for newly registered child.
   */
  getDefaultAttendanceProfile(): IAttendanceProfileDefaults {
    return {
      attendanceEnabled: true,
      totalAttendance: 0,
      recognitionStatus: 'Pending',
    };
  }

  /**
   * Automatically initializes attendance tracking capability for child during registration.
   */
  async initializeAttendanceProfile(
    prismaTx: Prisma.TransactionClient,
    childId: string
  ): Promise<IAttendanceProfileDefaults> {
    const profileDefaults = this.getDefaultAttendanceProfile();
    this.logger.log(`Attendance profile initialized for child ${childId}: enabled=${profileDefaults.attendanceEnabled}, recognition=${profileDefaults.recognitionStatus}`);
    return profileDefaults;
  }
}
