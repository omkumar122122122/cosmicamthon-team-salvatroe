import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ResolveWellnessAlertDto {
  @ApiProperty({ example: 'alert-uuid-1234' })
  @IsString()
  @IsNotEmpty()
  alertId: string;

  @ApiPropertyOptional({ example: 'Canceled after direct welfare check by social worker.' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class WellnessAlertItemDto {
  @ApiProperty({ example: 'alert-uuid-1234' })
  id: string;

  @ApiProperty({ example: 'HIGH' })
  severity: string;

  @ApiProperty({ example: 'OPEN' })
  status: string;

  @ApiProperty({ example: 'Wellness Alert: Needs Attention' })
  title: string;

  @ApiProperty({ example: 'Child Rahul Sharma (CH-2026-00125) wellness score dropped to 42.' })
  details: string;

  @ApiProperty({ example: 'child-uuid-1234' })
  childId: string;

  @ApiProperty({ example: 'Rahul Sharma' })
  childName: string;

  @ApiProperty({ example: 'Little Angels Orphanage' })
  orphanageName: string;

  @ApiProperty({ example: '2026-08-01T08:30:00.000Z' })
  createdAt: string;
}
