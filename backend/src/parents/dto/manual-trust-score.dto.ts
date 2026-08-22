import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ManualTrustScoreDto {
  @ApiProperty({
    example: 5,
    description: 'Delta to apply (positive to increase, negative to decrease). Clamped to 0–100.',
  })
  @IsInt()
  @Min(-100)
  @Max(100)
  @Type(() => Number)
  delta: number;

  @ApiProperty({
    example: 'Extra background check completed — no issues found.',
    description: 'Reason for the manual adjustment (required for audit)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
