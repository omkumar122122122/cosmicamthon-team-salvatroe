import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';
import { ParentVerificationStatus } from '../enums/parent.enums';

export class UpdateVerificationStatusDto {
  @ApiProperty({
    enum: ParentVerificationStatus,
    example: ParentVerificationStatus.APPROVED,
    description: 'New verification status',
  })
  @IsEnum(ParentVerificationStatus)
  status: ParentVerificationStatus;

  @ApiPropertyOptional({
    example: 'All documents verified and income confirmed.',
    description: 'Admin notes on this status change',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  verificationNotes?: string;

  @ApiPropertyOptional({
    example: 'Submitted income documents are insufficient.',
    description: 'Required when status is REJECTED or DOCUMENTS_REQUIRED',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;

  @ApiPropertyOptional({ example: '2024-04-20T10:00:00Z', description: 'ISO datetime for scheduled interview' })
  @IsOptional()
  @IsDateString()
  interviewDate?: string;

  @ApiPropertyOptional({ example: 'Interview conducted via video call; candidate was well-prepared.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  interviewNotes?: string;
}
