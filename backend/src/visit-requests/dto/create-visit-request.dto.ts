import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsUUID,
  ValidateIf,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateVisitRequestDto {
  @ApiProperty({
    description: 'Orphanage ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsNotEmpty()
  orphanageId: string;

  @ApiProperty({
    description: 'Preferred visit date (YYYY-MM-DD)',
    example: '2026-07-20',
  })
  @IsDateString()
  @IsNotEmpty()
  visitDate: string;

  @ApiProperty({
    description: 'Preferred visit time (HH:mm 24-hour format)',
    example: '10:30',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'visitTime must be in HH:mm format (24-hour)',
  })
  visitTime: string;

  @ApiProperty({
    description: 'Purpose of visit',
    example: 'Adoption Inquiry',
    enum: [
      'Adoption Inquiry',
      'Meet Child',
      'Document Verification',
      'Counselling',
      'General Visit',
    ],
  })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({
    description: 'Expected adoption timeline',
    example: '3 to 6 months',
    required: false,
  })
  @IsString()
  @IsOptional()
  adoptionTimeline?: string;

  @ApiProperty({
    description: 'Reason for adoption (minimum 50 characters)',
    example: 'We want to provide a loving home and education...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50, { message: 'Reason must be at least 50 characters' })
  @MaxLength(1000, { message: 'Reason cannot exceed 1000 characters' })
  reason: string;

  @ApiProperty({
    description: 'Family background description (minimum 100 characters)',
    example: 'We are a stable family with supportive environment...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(100, { message: 'Family background must be at least 100 characters' })
  @MaxLength(2000, { message: 'Family background cannot exceed 2000 characters' })
  familyBackground: string;


  @ApiProperty({
    description: 'Number of visitors (1-5)',
    example: 2,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  visitorsCount: number;

  @ApiProperty({
    description: 'Relationship of visitors',
    example: 'Spouse, parent',
    required: false,
  })
  @IsString()
  @IsOptional()
  relationshipOfVisitors?: string;

  @ApiProperty({
    description: 'Special requirements',
    example: 'Accessibility support needed',
    required: false,
  })
  @IsString()
  @IsOptional()
  specialRequirements?: string;

  @ApiProperty({
    description: 'Agreement to follow orphanage rules',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  agreedToRules: boolean;

  @ApiProperty({
    description: 'Child ID (optional, if visiting specific child)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @ValidateIf((o) => !!o.childId)
  @IsUUID(undefined, { message: 'childId must be a valid UUID' })
  @IsOptional()
  childId?: string;
}
