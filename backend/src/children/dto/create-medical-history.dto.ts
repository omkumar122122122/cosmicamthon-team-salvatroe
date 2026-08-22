import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsEnum,
  IsBoolean, IsDateString, MaxLength,
} from 'class-validator';
import { MedicalConditionSeverity } from '../enums/child.enums';

export class CreateMedicalHistoryDto {
  @ApiProperty({ example: 'Asthma', description: 'Name of the medical condition' })
  @IsString() @IsNotEmpty() @MaxLength(200)
  conditionName: string;

  @ApiPropertyOptional({ enum: MedicalConditionSeverity, default: MedicalConditionSeverity.MILD })
  @IsOptional() @IsEnum(MedicalConditionSeverity)
  severity?: MedicalConditionSeverity;

  @ApiPropertyOptional({ example: '2021-03-15' })
  @IsOptional() @IsDateString()
  diagnosedDate?: string;

  @ApiPropertyOptional({ example: 'Dr. Suresh Patel' })
  @IsOptional() @IsString() @MaxLength(150)
  diagnosedBy?: string;

  @ApiPropertyOptional({ example: 'AIIMS Mumbai' })
  @IsOptional() @IsString() @MaxLength(200)
  diagnosedAt?: string;

  @ApiPropertyOptional({ example: true, description: 'Is this condition currently active?' })
  @IsOptional() @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  isChronicCondition?: boolean;

  @ApiPropertyOptional({ example: 'Prescribed Salbutamol inhaler 2 puffs as needed' })
  @IsOptional() @IsString() @MaxLength(1000)
  treatmentDetails?: string;

  @ApiPropertyOptional({ example: 'Salbutamol 100mcg, Budesonide 200mcg' })
  @IsOptional() @IsString() @MaxLength(500)
  medications?: string;

  @ApiPropertyOptional({ example: 'Pollen, dust mites' })
  @IsOptional() @IsString() @MaxLength(300)
  allergies?: string;

  @ApiPropertyOptional({ example: '2023-06-10', description: 'Date condition resolved (if resolved)' })
  @IsOptional() @IsDateString()
  resolvedDate?: string;

  @ApiPropertyOptional({ example: 'Condition under control with medication' })
  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}

export class UpdateMedicalHistoryDto extends CreateMedicalHistoryDto {}
