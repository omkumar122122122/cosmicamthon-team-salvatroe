import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AlertStatus, AlertSeverity, AlertType } from '@prisma/client';

export class QueryAlertDto {
  @ApiPropertyOptional({
    description: 'Filter by alert status',
    enum: AlertStatus,
    example: AlertStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional({
    description: 'Filter by severity level',
    enum: AlertSeverity,
    example: AlertSeverity.HIGH,
  })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional({
    description: 'Filter by alert type',
    enum: AlertType,
    example: AlertType.HEALTH_CRITICAL,
  })
  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;
}
