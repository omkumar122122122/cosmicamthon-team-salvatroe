import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsEnum, IsBoolean, IsNumber,
  IsDateString, IsPhoneNumber, Min, Max, MaxLength, MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  MaritalStatus, EmploymentType, IncomeRange,
  HouseOwnership, ChildGenderPreference,
} from '../enums/parent.enums';

export class CreateParentDto {
  // ── Personal ──────────────────────────────

  @ApiPropertyOptional({ example: '1985-06-15', description: 'Date of birth (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'MALE', description: 'Gender' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'Indian' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationality?: string;

  @ApiPropertyOptional({ example: 'Hindu' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  religion?: string;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  spouseName?: string;

  @ApiPropertyOptional({ example: '1987-03-20' })
  @IsOptional()
  @IsDateString()
  spouseDateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  spouseOccupation?: string;

  // ── Contact ───────────────────────────────

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsOptional()
  @IsPhoneNumber(undefined)
  alternatePhone?: string;

  @ApiPropertyOptional({ example: '+919876543212' })
  @IsOptional()
  @IsPhoneNumber(undefined)
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'Ramesh Sharma' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: 'Brother' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactRelation?: string;

  // ── Occupation & Income ───────────────────

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ example: 'Infosys Ltd.' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  employerName?: string;

  @ApiPropertyOptional({ example: 'Plot 5, Tech Park, Bangalore' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  employerAddress?: string;

  @ApiPropertyOptional({ example: '+918022334455' })
  @IsOptional()
  @IsString()
  workPhone?: string;

  @ApiPropertyOptional({ example: 8, description: 'Years of work experience' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  @Type(() => Number)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 1200000, description: 'Annual income in INR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  annualIncome?: number;

  @ApiPropertyOptional({ enum: IncomeRange })
  @IsOptional()
  @IsEnum(IncomeRange)
  incomeRange?: IncomeRange;

  // ── Housing ───────────────────────────────

  @ApiPropertyOptional({ enum: HouseOwnership })
  @IsOptional()
  @IsEnum(HouseOwnership)
  houseOwnership?: HouseOwnership;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  numberOfRooms?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasChildRoom?: boolean;

  // ── Health ────────────────────────────────

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasChronicIllness?: boolean;

  @ApiPropertyOptional({ example: 'Diabetes Type 2' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  chronicIllnessDetails?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasDisability?: boolean;

  @ApiPropertyOptional({ example: 'Visual impairment — corrected with glasses' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  disabilityDetails?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasHealthInsurance?: boolean;

  // ── Adoption Preferences ─────────────────

  @ApiPropertyOptional({ example: '3-7', description: 'Preferred child age range' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  preferredChildAge?: string;

  @ApiPropertyOptional({ enum: ChildGenderPreference, example: ChildGenderPreference.ANY })
  @IsOptional()
  @IsEnum(ChildGenderPreference)
  preferredGender?: ChildGenderPreference;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  preferredCount?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  openToSpecialNeeds?: boolean;

  @ApiPropertyOptional({ example: 'Open to mild developmental delays' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialNeedsDetails?: string;

  @ApiPropertyOptional({
    example: 'We have always wanted to provide a loving home to a child in need.',
    description: 'Motivation for adoption (max 1000 chars)',
  })
  @IsOptional()
  @IsString()
  @MinLength(50, { message: 'Please describe your motivation in at least 50 characters' })
  @MaxLength(1000)
  adoptionMotivation?: string;

  // ── References ───────────────────────────

  @ApiPropertyOptional({ example: 'Dr. Vikram Mehta' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference1Name?: string;

  @ApiPropertyOptional({ example: '+919876540001' })
  @IsOptional()
  @IsPhoneNumber(undefined)
  reference1Phone?: string;

  @ApiPropertyOptional({ example: 'Family Doctor' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference1Relation?: string;

  @ApiPropertyOptional({ example: 'Priya Nair' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference2Name?: string;

  @ApiPropertyOptional({ example: '+919876540002' })
  @IsOptional()
  @IsPhoneNumber(undefined)
  reference2Phone?: string;

  @ApiPropertyOptional({ example: 'Colleague' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference2Relation?: string;

  // ── Previous Adoption ─────────────────────

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasAdoptedBefore?: boolean;

  @ApiPropertyOptional({ example: 'Adopted a girl child in 2015 via CARA.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  previousAdoptionDetails?: string;
}
