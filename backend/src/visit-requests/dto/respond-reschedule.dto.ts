import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class RespondRescheduleDto {
  @ApiProperty({
    description: 'Parent action on proposed visit reschedule (ACCEPT or REJECT)',
    example: 'ACCEPT',
    enum: ['ACCEPT', 'REJECT'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACCEPT', 'REJECT'], { message: 'action must be either ACCEPT or REJECT' })
  action: 'ACCEPT' | 'REJECT';

  @ApiPropertyOptional({
    description: 'Reason if rejecting the proposed reschedule slot',
    example: 'Proposed time conflicts with work shift.',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
