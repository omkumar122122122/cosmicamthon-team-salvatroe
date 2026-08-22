import { ApiProperty } from '@nestjs/swagger';

export class AttendanceProfileSummaryDto {
  @ApiProperty({ example: true })
  attendanceEnabled: boolean;

  @ApiProperty({ example: 0 })
  totalAttendance: number;

  @ApiProperty({ example: 'Pending' })
  recognitionStatus: string;
}

export class RegisteredChildDataDto {
  @ApiProperty({ example: 'child-uuid-1234' })
  id: string;

  @ApiProperty({ example: 'CH-2026-00125' })
  childCode: string;

  @ApiProperty({ example: 'Rahul' })
  firstName: string;

  @ApiProperty({ example: 'Sharma' })
  lastName: string;

  @ApiProperty({ example: 'Rahul Sharma' })
  fullName: string;

  @ApiProperty({ example: 8 })
  approximateAge: number;

  @ApiProperty({ example: 'REGISTERED' })
  registrationStatus: string;

  @ApiProperty({ example: 'Pending' })
  aiEnrollmentStatus: string;

  @ApiProperty({ example: '2026-08-01T12:00:00.000Z' })
  registrationTimestamp: string;

  @ApiProperty({ example: 'Little Angels Orphanage' })
  orphanageName: string;

  @ApiProperty({ type: AttendanceProfileSummaryDto })
  attendanceProfile: AttendanceProfileSummaryDto;
}

export class RegisterChildResponseDto {
  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ example: 'Child registered successfully' })
  message: string;

  @ApiProperty({ type: RegisteredChildDataDto })
  data: RegisteredChildDataDto;
}
