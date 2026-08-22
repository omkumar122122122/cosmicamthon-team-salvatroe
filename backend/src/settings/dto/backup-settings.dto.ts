import { IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BackupSettingsDto {
  @ApiPropertyOptional({ example: 'DAILY', enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL'] })
  @IsOptional()
  @IsIn(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL'])
  schedule?: string;

  @ApiPropertyOptional({ example: 30, minimum: 7, maximum: 365, description: 'Backup retention in days' })
  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(365)
  retentionDays?: number;
}
