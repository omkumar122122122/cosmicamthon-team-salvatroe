import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CancelVisitRequestDto {
  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Change of plans due to personal circumstances',
  })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
