import { IsBoolean, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuditSettingsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  auditLogging?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  loginLogs?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  actionLogs?: boolean;

  @ApiPropertyOptional({ example: 365, minimum: 30, maximum: 3650, description: 'Log retention period in days' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(3650)
  retentionPeriod?: number;
}
