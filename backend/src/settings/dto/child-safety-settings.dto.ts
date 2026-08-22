import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ChildSafetySettingsDto {
  @ApiPropertyOptional({ example: 70, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  aiRiskThreshold?: number;

  @ApiPropertyOptional({ example: 80, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  highRiskScore?: number;

  @ApiPropertyOptional({ example: 50, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  mediumRiskScore?: number;

  @ApiPropertyOptional({ example: 30, minimum: 7, maximum: 365, description: 'Welfare session frequency in days' })
  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(365)
  welfareSessionFrequency?: number;

  @ApiPropertyOptional({ example: 90, minimum: 7, maximum: 365, description: 'Adoption follow-up interval in days' })
  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(365)
  adoptionFollowUpInterval?: number;

  @ApiPropertyOptional({ example: 90, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  emergencyAlertThreshold?: number;
}
