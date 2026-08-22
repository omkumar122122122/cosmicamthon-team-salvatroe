import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ChildGender, BloodGroup, HealthStatus } from '@prisma/client';

export class UpdateChildProfileDto {
  @ApiPropertyOptional({ example: 'Rahul' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(18)
  approximateAge?: number;

  @ApiPropertyOptional({ enum: ChildGender })
  @IsOptional()
  @IsEnum(ChildGender)
  gender?: ChildGender;

  @ApiPropertyOptional({ enum: BloodGroup })
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

  @ApiPropertyOptional({ example: 'Scar on left wrist' })
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

  @ApiPropertyOptional({ enum: HealthStatus })
  @IsOptional()
  @IsEnum(HealthStatus)
  healthStatus?: HealthStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasDisability?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  disabilityDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasChronicCondition?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chronicConditionDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVaccinationComplete?: boolean;

  @ApiPropertyOptional({ example: 'Room 12, Block B' })
  @IsOptional()
  @IsString()
  roomNo?: string;

  @ApiPropertyOptional({ example: 'Meera Nair' })
  @IsOptional()
  @IsString()
  caretaker?: string;

  @ApiPropertyOptional({ example: 'Govt Primary School Class 4' })
  @IsOptional()
  @IsString()
  classSchool?: string;

  @ApiPropertyOptional({ example: 'Requires regular eye checkup' })
  @IsOptional()
  @IsString()
  specialNotes?: string;
}
