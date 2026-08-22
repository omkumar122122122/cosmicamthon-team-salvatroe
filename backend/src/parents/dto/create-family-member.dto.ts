import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsEnum,
  IsBoolean, IsNumber, IsDateString, MaxLength,
  IsPhoneNumber, Min, Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RelationshipType } from '../enums/parent.enums';

export class CreateFamilyMemberDto {
  @ApiProperty({ example: 'Priya Sharma', description: 'Full name of the family member' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: RelationshipType, example: RelationshipType.SPOUSE })
  @IsEnum(RelationshipType)
  relationship: RelationshipType;

  @ApiPropertyOptional({ example: '1988-09-10' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'FEMALE' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'School Teacher' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional({ example: 800000, description: 'Annual income in INR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  annualIncome?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this member is financially dependent on the parent',
  })
  @IsOptional()
  @IsBoolean()
  isDependent?: boolean;

  @ApiPropertyOptional({ example: '+919876500001' })
  @IsOptional()
  @IsPhoneNumber(undefined)
  contactPhone?: string;

  @ApiPropertyOptional({
    example: 'XXXX-XXXX-1234',
    description: 'Last 4 digits of Aadhaar (masked)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  aadharNumber?: string;

  @ApiPropertyOptional({ example: 'Lives in the same household' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateFamilyMemberDto extends CreateFamilyMemberDto {}
