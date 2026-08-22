import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum RejectionReason {
  INCOMPLETE_DOCUMENTS = 'Incomplete Documents',
  FAILED_VERIFICATION = 'Failed Verification',
  HIGH_RISK = 'High Risk',
  SUSPICIOUS_BEHAVIOUR = 'Suspicious Behaviour',
  POLICE_CLEARANCE_PENDING = 'Police Clearance Pending',
  KYC_NOT_APPROVED = 'KYC Not Approved',
  ORPHANAGE_CAPACITY = 'Orphanage Capacity Full',
  OTHER = 'Other',
}

export class RejectVisitRequestDto {
  @ApiProperty({
    description: 'Reason for rejection',
    enum: RejectionReason,
    example: RejectionReason.INCOMPLETE_DOCUMENTS,
  })
  @IsEnum(RejectionReason)
  @IsNotEmpty()
  reason: RejectionReason;

  @ApiPropertyOptional({
    description: 'Additional comments explaining the rejection',
    example: 'Please submit marriage certificate and address proof...',
  })
  @IsString()
  @IsOptional()
  comments?: string;
}
