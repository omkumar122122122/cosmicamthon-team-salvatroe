import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsEnum, IsBoolean, IsNumber,
  IsDateString, MinLength, MaxLength, Min, Max, IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ChildGender, ChildStatus, AdoptionStatus,
  HealthStatus, BloodGroup,
} from '../enums/child.enums';

export class CreateChildDto {
  // ── Personal ─────────────────────────────

  @ApiProperty({ example: 'Arjun' })
  @IsString() @IsNotEmpty() @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional() @IsString() @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiPropertyOptional({ example: '2015-06-20', description: 'ISO 8601 date. Use approximateAge if unknown.' })
  @IsOptional() @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 9, description: 'Approximate age in years (when DOB is unknown)' })
  @IsOptional() @IsNumber() @Min(0) @Max(18) @Type(() => Number)
  approximateAge?: number;

  @ApiPropertyOptional({ enum: ChildGender, default: ChildGender.UNKNOWN })
  @IsOptional() @IsEnum(ChildGender)
  gender?: ChildGender;

  @ApiPropertyOptional({ example: 'Indian' })
  @IsOptional() @IsString() @MaxLength(60)
  nationality?: string;

  @ApiPropertyOptional({ example: 'Hindu' })
  @IsOptional() @IsString() @MaxLength(60)
  religion?: string;

  @ApiPropertyOptional({ example: 'Hindi' })
  @IsOptional() @IsString() @MaxLength(60)
  motherTongue?: string;

  @ApiPropertyOptional({ example: 'OBC' })
  @IsOptional() @IsString() @MaxLength(60)
  caste?: string;

  // ── Physical ─────────────────────────────

  @ApiPropertyOptional({ example: 125.5, description: 'Height in cm' })
  @IsOptional() @IsNumber() @Min(0) @Max(300) @Type(() => Number)
  height?: number;

  @ApiPropertyOptional({ example: 28.3, description: 'Weight in kg' })
  @IsOptional() @IsNumber() @Min(0) @Max(300) @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional({ enum: BloodGroup, default: BloodGroup.UNKNOWN })
  @IsOptional() @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ example: 'Medium brown' })
  @IsOptional() @IsString() @MaxLength(60)
  skinTone?: string;

  @ApiPropertyOptional({ example: 'Brown' })
  @IsOptional() @IsString() @MaxLength(60)
  eyeColor?: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional() @IsString() @MaxLength(60)
  hairColor?: string;

  @ApiPropertyOptional({ example: 'Small scar on left knee' })
  @IsOptional() @IsString() @MaxLength(500)
  distinguishingMarks?: string;

  // ── Identity ─────────────────────────────

  @ApiPropertyOptional({ example: 'XXXX-XXXX-1234', description: 'Masked Aadhaar' })
  @IsOptional() @IsString() @MaxLength(30)
  aadhaarNumber?: string;

  @ApiPropertyOptional({ example: 'BC-2015-MH-001234' })
  @IsOptional() @IsString() @MaxLength(60)
  birthCertNumber?: string;

  // ── Health Overview ───────────────────────

  @ApiPropertyOptional({ enum: HealthStatus, default: HealthStatus.UNKNOWN })
  @IsOptional() @IsEnum(HealthStatus)
  healthStatus?: HealthStatus;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  hasDisability?: boolean;

  @ApiPropertyOptional({ example: 'Mild hearing impairment' })
  @IsOptional() @IsString() @MaxLength(500)
  disabilityDetails?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  hasChronicCondition?: boolean;

  @ApiPropertyOptional({ example: 'Asthma — managed with inhaler' })
  @IsOptional() @IsString() @MaxLength(500)
  chronicConditionDetails?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isVaccinationComplete?: boolean;

  // ── Status ────────────────────────────────

  @ApiPropertyOptional({ enum: ChildStatus, default: ChildStatus.REGISTERED })
  @IsOptional() @IsEnum(ChildStatus)
  currentStatus?: ChildStatus;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  isAdoptable?: boolean;

  // ── Entry Info ────────────────────────────

  @ApiPropertyOptional({ example: '2022-09-01' })
  @IsOptional() @IsDateString()
  admissionDate?: string;

  @ApiPropertyOptional({ example: 'Parents deceased in road accident' })
  @IsOptional() @IsString() @MaxLength(500)
  admissionReason?: string;

  @ApiPropertyOptional({ example: 'police', description: 'police | court | ngo | self-surrender | hospital' })
  @IsOptional() @IsString() @MaxLength(100)
  entrySource?: string;

  @ApiPropertyOptional({ example: 'District Child Welfare Committee' })
  @IsOptional() @IsString() @MaxLength(200)
  referredBy?: string;

  // ── Family Background ─────────────────────

  @ApiPropertyOptional({ example: 'Rajesh Sharma' })
  @IsOptional() @IsString() @MaxLength(100)
  fatherName?: string;

  @ApiPropertyOptional({ example: 'DECEASED', description: 'ALIVE | DECEASED | UNKNOWN' })
  @IsOptional() @IsString() @MaxLength(20)
  fatherStatus?: string;

  @ApiPropertyOptional({ example: 'Sunita Sharma' })
  @IsOptional() @IsString() @MaxLength(100)
  motherName?: string;

  @ApiPropertyOptional({ example: 'DECEASED' })
  @IsOptional() @IsString() @MaxLength(20)
  motherStatus?: string;

  @ApiPropertyOptional({ example: 'MARRIED' })
  @IsOptional() @IsString() @MaxLength(30)
  parentsMaritalStatus?: string;

  @ApiPropertyOptional({ example: 'Child found abandoned near railway station. Parents unknown.' })
  @IsOptional() @IsString() @MaxLength(2000)
  familyBackground?: string;

  // ── Location ─────────────────────────────

  @ApiPropertyOptional({ example: 'Near CST Railway Station, Mumbai' })
  @IsOptional() @IsString() @MaxLength(300)
  foundLocation?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional() @IsString() @MaxLength(100)
  foundDistrict?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional() @IsString() @MaxLength(100)
  foundState?: string;

  // ── Notes ─────────────────────────────────

  @ApiPropertyOptional({ example: 'Child is shy; needs extra emotional support' })
  @IsOptional() @IsString() @MaxLength(2000)
  specialNotes?: string;

  @ApiPropertyOptional({ example: 'Internal case notes for staff only' })
  @IsOptional() @IsString() @MaxLength(2000)
  internalNotes?: string;

  @ApiPropertyOptional({ example: 'orphanage-uuid-here', description: 'Orphanage ID (assigned by admin)' })
  @IsOptional() @IsString()
  orphanageId?: string;
}
