import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsEnum, IsBoolean,
  IsDateString, MaxLength, IsNotEmpty,
} from 'class-validator';
import { PoliceVerificationStatus } from '../enums/parent.enums';

/** Used by admin to initiate a police verification */
export class InitiatePoliceVerificationDto {
  @ApiPropertyOptional({ example: 'Koramangala Police Station' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  appliedStation?: string;

  @ApiPropertyOptional({ example: '8th Block, Koramangala, Bangalore' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  stationAddress?: string;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsOptional()
  @IsDateString()
  appliedAt?: string;

  @ApiPropertyOptional({ example: 'PVR-2024-001234' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  applicationNumber?: string;
}

/** Used by admin to update police verification progress */
export class UpdatePoliceVerificationDto {
  @ApiPropertyOptional({ enum: PoliceVerificationStatus })
  @IsOptional()
  @IsEnum(PoliceVerificationStatus)
  status?: PoliceVerificationStatus;

  @ApiPropertyOptional({ example: 'Sub-Inspector Rajan Kumar' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  officerName?: string;

  @ApiPropertyOptional({ example: 'KAR-1234' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  officerBadgeNumber?: string;

  @ApiPropertyOptional({ example: '+918022112233' })
  @IsOptional()
  @IsString()
  officerPhone?: string;

  @ApiPropertyOptional({ example: '2024-03-15' })
  @IsOptional()
  @IsDateString()
  clearedAt?: string;

  @ApiPropertyOptional({ example: 'PVC-2024-5678' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  certificateNumber?: string;

  @ApiPropertyOptional({ example: '2027-03-15' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ example: 'Certificate available at police station' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  flagReason?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  crimeRecordFound?: boolean;

  @ApiPropertyOptional({ example: 'Petty misdemeanor in 2010 — closed case' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  crimeRecordDetails?: string;

  @ApiPropertyOptional({ example: '2024-04-01' })
  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;

  @ApiPropertyOptional({ example: 'Verification in progress. Station contacted.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNotes?: string;
}
