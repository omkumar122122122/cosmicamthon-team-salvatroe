import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class NoShowVisitDto {
  @ApiPropertyOptional({
    description: 'Reason or notes for recording a parent no show',
    example: 'Parent did not arrive within 30 minutes of scheduled slot.',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
