import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChildGender, BloodGroup, HealthStatus } from '@prisma/client';

export class EmergencyContactDto {
  @ApiProperty({ example: 'Sunita Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Aunt / Guardian' })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: '12 Sector 4, New Delhi' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class LegalRescueDetailsDto {
  @ApiPropertyOptional({ example: 'CWC-ND-2026-881' })
  @IsOptional()
  @IsString()
  caseNo?: string;

  @ApiPropertyOptional({ example: 'FIR-102/2026' })
  @IsOptional()
  @IsString()
  firNo?: string;

  @ApiPropertyOptional({ example: 'Childline 1098 / State Police' })
  @IsOptional()
  @IsString()
  rescueAgency?: string;

  @ApiPropertyOptional({ example: 'CWC Court Order #482' })
  @IsOptional()
  @IsString()
  cwcOrderDetails?: string;
}

export class RegisterChildDto {
  // Basic Information
  @ApiProperty({ example: 'Rahul' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '2017-05-15' })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid ISO date string' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Approximate age cannot be negative' })
  @Max(18, { message: 'Approximate age cannot exceed 18' })
  approximateAge?: number;

  @ApiPropertyOptional({ enum: ChildGender, default: ChildGender.UNKNOWN })
  @IsOptional()
  @IsEnum(ChildGender)
  gender?: ChildGender;

  @ApiPropertyOptional({ enum: BloodGroup, default: BloodGroup.UNKNOWN })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ example: 'Hindi' })
  @IsOptional()
  @IsString()
  motherTongue?: string;

  @ApiPropertyOptional({ example: 'Indian' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ example: 'Scar on left forearm, birthmark on right shoulder' })
  @IsOptional()
  @IsString()
  distinguishingMarks?: string;

  @ApiPropertyOptional({ example: '1234 5678 9012' })
  @IsOptional()
  @IsString()
  aadhaarNumber?: string;

  @ApiPropertyOptional({ example: 'BC-998812' })
  @IsOptional()
  @IsString()
  birthCertNumber?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/photos/child-1.jpg' })
  @IsOptional()
  @IsString()
  photo?: string;

  // Admission Details
  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  admissionDate?: string;

  @ApiPropertyOptional({ example: 'Found alone near New Delhi Railway Station' })
  @IsOptional()
  @IsString()
  entrySource?: string;

  @ApiPropertyOptional({ example: 'Intake registration via CWC order' })
  @IsOptional()
  @IsString()
  admissionReason?: string;

  @ApiPropertyOptional({ example: 'New Delhi Railway Station' })
  @IsOptional()
  @IsString()
  foundLocation?: string;

  @ApiPropertyOptional({ example: 'Central Delhi' })
  @IsOptional()
  @IsString()
  foundDistrict?: string;

  @ApiPropertyOptional({ example: 'Delhi' })
  @IsOptional()
  @IsString()
  foundState?: string;

  @ApiPropertyOptional({ example: 'cwc-id-uuid' })
  @IsOptional()
  @IsString()
  orphanageId?: string;

  @ApiPropertyOptional({ example: 'Room R-12, Block B' })
  @IsOptional()
  @IsString()
  roomNo?: string;

  @ApiPropertyOptional({ example: 'Officer Ramesh Kumar' })
  @IsOptional()
  @IsString()
  caretaker?: string;

  @ApiPropertyOptional({ example: 'Govt Primary School, Class 4A' })
  @IsOptional()
  @IsString()
  classSchool?: string;

  // Medical Information
  @ApiPropertyOptional({ enum: HealthStatus, default: HealthStatus.UNKNOWN })
  @IsOptional()
  @IsEnum(HealthStatus)
  healthStatus?: HealthStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasDisability?: boolean;

  @ApiPropertyOptional({ example: 'None' })
  @IsOptional()
  @IsString()
  disabilityDetails?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasChronicCondition?: boolean;

  @ApiPropertyOptional({ example: 'Asthma (Inhaler daily)' })
  @IsOptional()
  @IsString()
  chronicConditionDetails?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVaccinationComplete?: boolean;

  @ApiPropertyOptional({ example: 'Stable health, requires routine dental checkup' })
  @IsOptional()
  @IsString()
  medicalCondition?: string;

  // Emergency & Rescue Details
  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ type: LegalRescueDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LegalRescueDetailsDto)
  legalRescueDetails?: LegalRescueDetailsDto;
}
