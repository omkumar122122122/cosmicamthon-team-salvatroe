import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class StartAttendanceSessionDto {
  @ApiPropertyOptional({ example: 'orphanage-uuid-1234' })
  @IsOptional()
  @IsString()
  orphanageId?: string;

  @ApiPropertyOptional({ example: 'CAM-01-ENTRY' })
  @IsOptional()
  @IsString()
  cameraId?: string;
}

export class SessionActionDto {
  @ApiProperty({ example: 'session-uuid-1234' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class AttendanceSessionStatusResponseDto {
  @ApiProperty({ example: 'session-uuid-1234' })
  sessionId: string;

  @ApiProperty({ example: 'orphanage-uuid-1234' })
  orphanageId: string;

  @ApiProperty({ example: 'Little Angels Orphanage' })
  orphanageName: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 45 })
  totalRegisteredChildren: number;

  @ApiProperty({ example: 38 })
  presentCount: number;

  @ApiProperty({ example: 7 })
  absentCount: number;

  @ApiProperty({ example: 2 })
  unknownFaceCount: number;

  @ApiProperty({ example: '2026-08-01T08:00:00.000Z' })
  startTime: string;
}
