import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class ApproveVisitRequestDto {
  @ApiPropertyOptional({ description: 'Confirmed visit date' })
  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @ApiPropertyOptional({ description: 'Confirmed visit time (HH:mm)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  visitTime?: string;

  @ApiPropertyOptional({ description: 'Meeting room assignment' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  meetingRoom?: string;

  @ApiPropertyOptional({ description: 'Assigned staff member name or user ID' })
  @IsOptional()
  @IsString()
  staffMember?: string;

  @ApiPropertyOptional({ description: 'Visitor limit' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  visitorLimit?: number;

  @ApiPropertyOptional({ description: 'Instructions for the parent' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @ApiPropertyOptional({ description: 'Approval notes (internal)' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  approvalNotes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  generateQr?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notifyParent?: boolean;
}

export class RejectVisitRequestDto {
  @ApiProperty({ description: 'Rejection reason', example: 'Incomplete Documents' })
  @IsString()
  @MaxLength(200)
  reason: string;

  @ApiPropertyOptional({ description: 'Additional comments' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}

export class RescheduleVisitRequestDto {
  @ApiProperty({ description: 'New visit date (ISO)' })
  @IsDateString()
  newDate: string;

  @ApiPropertyOptional({ description: 'New visit time (HH:mm)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  newTime?: string;

  @ApiPropertyOptional({ description: 'Reason for reschedule' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notifyParent?: boolean;
}

export class CancelVisitRequestDto {
  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CompleteVisitRequestDto {
  @ApiPropertyOptional({ description: 'Visit completion notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
