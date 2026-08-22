import { ApiProperty } from '@nestjs/swagger';
import { AdoptionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateAdoptionStatusDto {
  @ApiProperty({ enum: [AdoptionStatus.COMPLETED, AdoptionStatus.CANCELLED] })
  @IsEnum(AdoptionStatus)
  status: AdoptionStatus;

  @ApiProperty({ required: false })
  @ValidateIf((o) => o.status === AdoptionStatus.CANCELLED)
  @IsString()
  cancellationReason?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() reviewNotes?: string;
}
