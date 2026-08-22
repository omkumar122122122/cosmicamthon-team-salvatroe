import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class ApproveVisitRequestDto {
  @ApiProperty({
    description: 'Approved visit date (YYYY-MM-DD)',
    example: '2026-07-20',
  })
  @IsDateString()
  @IsNotEmpty()
  visitDate: string;

  @ApiProperty({
    description: 'Approved visit time (HH:mm 24-hour format)',
    example: '10:30',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'visitTime must be in HH:mm format (24-hour)',
  })
  visitTime: string;

  @ApiPropertyOptional({
    description: 'Meeting room assignment',
    example: 'Conference Room A',
  })
  @IsString()
  @IsOptional()
  meetingRoom?: string;

  @ApiPropertyOptional({
    description: 'Assigned staff member name',
    example: 'Meera Nair',
  })
  @IsString()
  @IsOptional()
  assignedStaff?: string;

  @ApiPropertyOptional({
    description: 'Visitor limit (1-10)',
    example: 2,
    minimum: 1,
    maximum: 10,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  visitorLimit?: number = 1;

  @ApiPropertyOptional({
    description: 'Special instructions for the visit',
    example: 'Please bring original identity documents...',
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Generate QR pass for the visit',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  generateQr?: boolean = true;

  @ApiPropertyOptional({
    description: 'Send notification to parent',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  notifyParent?: boolean = true;

  @ApiPropertyOptional({
    description: 'Approval notes from reviewer',
    example: 'All documents verified. Parent approved for visit.',
  })
  @IsString()
  @IsOptional()
  approvalNotes?: string;
}
