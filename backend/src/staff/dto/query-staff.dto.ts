import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrphanageStaffRole, StaffType } from '@prisma/client';

export class QueryStaffDto {
  @ApiPropertyOptional({
    description: 'Filter by staff type: ADMIN or ORPHANAGE',
    enum: StaffType,
  })
  @IsOptional()
  @IsEnum(StaffType)
  staffType?: StaffType;

  @ApiPropertyOptional({
    description: 'Search by name, employee ID, or email',
    example: 'Meera',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by orphanage ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Orphanage ID must be a valid UUID' })
  orphanageId?: string;

  @ApiPropertyOptional({
    description: 'Filter by staff role',
    enum: OrphanageStaffRole,
    example: 'CARETAKER',
  })
  @IsOptional()
  @IsEnum(OrphanageStaffRole)
  role?: OrphanageStaffRole;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['name', 'joiningDate', 'role', 'employeeId'],
    default: 'joiningDate',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'joiningDate';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
