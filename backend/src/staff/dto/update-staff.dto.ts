import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { OrphanageStaffRole } from '@prisma/client';

export class UpdateStaffDto {
  @ApiPropertyOptional({
    description: 'Role of the staff member',
    enum: OrphanageStaffRole,
    example: 'TEACHER',
  })
  @IsOptional()
  @IsEnum(OrphanageStaffRole, {
    message: 'Role must be a valid OrphanageStaffRole',
  })
  role?: OrphanageStaffRole;

  @ApiPropertyOptional({
    description: 'Designation/job title',
    example: 'Lead Teacher',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Designation must not exceed 100 characters' })
  designation?: string;

  @ApiPropertyOptional({
    description: 'Employee ID',
    example: 'EMP-002',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Employee ID must not exceed 50 characters' })
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601 format)',
    example: '2025-12-31T00:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid ISO date' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;
}
