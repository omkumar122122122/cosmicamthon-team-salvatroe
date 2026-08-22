import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDonationRequestStatusDto {
  @ApiProperty({
    enum: ['ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
    description: 'New status for the donation request',
  })
  @IsString()
  @IsIn(['ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'], {
    message: 'Status must be one of: ACCEPTED, REJECTED, COMPLETED, CANCELLED',
  })
  status: string;

  @ApiProperty({
    required: false,
    description: 'Reason for rejection (required when status is REJECTED)',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
