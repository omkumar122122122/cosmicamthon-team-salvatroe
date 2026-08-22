import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class StartAssessmentDto {
  @ApiProperty({ description: 'Child ID for post adoption assessment' })
  @IsString()
  @IsNotEmpty()
  childId: string;

  @ApiPropertyOptional({ description: 'Optional Schedule ID' })
  @IsString()
  @IsOptional()
  scheduleId?: string;
}
