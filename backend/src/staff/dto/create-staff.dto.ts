import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { OrphanageStaffRole, StaffType } from '@prisma/client';

export class CreateStaffDto {
  @ApiPropertyOptional({
    description: 'Type of staff: ADMIN or ORPHANAGE',
    enum: StaffType,
    example: 'ORPHANAGE',
  })
  @IsOptional()
  @IsEnum(StaffType)
  staffType?: StaffType;

  @ApiPropertyOptional({
    description: 'User ID to link to staff member',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Staff member email address',
    example: 'meera@orphanage.org',
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Staff member full name',
    example: 'Meera Nair',
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Orphanage ID where staff member will work',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsUUID('4', { message: 'Orphanage ID must be a valid UUID' })
  orphanageId?: string;

  @ApiProperty({
    description: 'Role of the staff member',
    enum: OrphanageStaffRole,
    example: 'CARETAKER',
  })
  @IsNotEmpty({ message: 'Staff role is required' })
  @IsEnum(OrphanageStaffRole, {
    message: 'Role must be a valid OrphanageStaffRole',
  })
  role: OrphanageStaffRole;

  @ApiPropertyOptional({
    description: 'Designation/job title',
    example: 'Senior Caretaker',
    maxLength: 100,
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Designation must not exceed 100 characters' })
  designation?: string;

  @ApiPropertyOptional({
    description: 'Employee ID (unique within orphanage)',
    example: 'EMP-001',
    maxLength: 50,
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Employee ID must not exceed 50 characters' })
  employeeId?: string;

  @ApiProperty({
    description: 'Joining date (ISO 8601 format)',
    example: '2024-01-15T00:00:00Z',
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsDateString({}, { message: 'Joining date must be a valid ISO date' })
  joiningDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601 format)',
    example: '2025-01-15T00:00:00Z',
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid ISO date' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the staff member',
    maxLength: 500,
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;
}
