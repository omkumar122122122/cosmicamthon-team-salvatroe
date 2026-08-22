import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Parent Registration DTO
 * Used when a parent registers through the login page
 */
export class RegisterParentDto {
  @ApiProperty({ example: 'John', description: 'Parent first name' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Parent last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Parent email address' })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email!: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Parent phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'SecurePassword123', description: 'Password' })
  @IsString()
  password!: string;

  @ApiProperty({ example: 'Father', description: 'Relationship type' })
  @IsString()
  relationship!: string;

  @ApiPropertyOptional({ example: '1985-05-15', description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'INDIAN', description: 'Nationality' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ example: 'Engineer', description: 'Occupation' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ example: 75000, description: 'Annual income in INR' })
  @IsOptional()
  @IsNumber()
  annualIncome?: number;

  @ApiPropertyOptional({ example: 'OWNED', description: 'House ownership status', enum: ['OWNED', 'RENTED', 'LEASED', 'FAMILY_OWNED'] })
  @IsOptional()
  @IsEnum(['OWNED', 'RENTED', 'LEASED', 'FAMILY_OWNED'])
  houseOwnership?: string;

  @ApiPropertyOptional({ example: 3, description: 'Number of rooms in house' })
  @IsOptional()
  @IsNumber()
  numberOfRooms?: number;

  @ApiPropertyOptional({ example: 'We want to provide a loving home to a child in need.', description: 'Adoption motivation' })
  @IsOptional()
  @IsString()
  adoptionMotivation?: string;
}