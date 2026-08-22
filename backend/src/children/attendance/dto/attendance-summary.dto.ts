import { ApiProperty } from '@nestjs/swagger';

export class AttendanceSummaryResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Attendance session ended successfully' })
  message: string;

  @ApiProperty({ example: 'session-uuid-1234' })
  sessionId: string;

  @ApiProperty({ example: 'Little Angels Orphanage' })
  orphanageName: string;

  @ApiProperty({ example: 50 })
  totalRegisteredChildren: number;

  @ApiProperty({ example: 44 })
  presentCount: number;

  @ApiProperty({ example: 6 })
  absentCount: number;

  @ApiProperty({ example: 88 })
  recognitionRatePercent: number;

  @ApiProperty({ example: 2 })
  unknownFaceCount: number;

  @ApiProperty({ example: 45 })
  durationMinutes: number;

  @ApiProperty({ example: ['Rohan Kumar', 'Sneha Patel', 'Aarav Gupta'] })
  absentChildNames: string[];
}
