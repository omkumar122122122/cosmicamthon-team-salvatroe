import { IsBoolean, IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportSettingsDto {
  @ApiPropertyOptional({ example: 'PDF', enum: ['PDF', 'EXCEL', 'CSV'] })
  @IsOptional()
  @IsIn(['PDF', 'EXCEL', 'CSV'])
  defaultFormat?: string;

  @ApiPropertyOptional({ example: 365, minimum: 30, maximum: 3650, description: 'Report retention in days' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(3650)
  reportRetention?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoMonthlyReports?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  autoWeeklyReports?: boolean;
}
