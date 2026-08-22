import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

enum VisitRequestStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

enum RiskLevelEnum {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

enum SortByEnum {
  visitDate = 'visitDate',
  createdAt = 'createdAt',
  status = 'status',
  trustScore = 'trustScore',
}

enum SortOrderEnum {
  asc = 'asc',
  desc = 'desc',
}

export class QueryVisitRequestDto {
  @ApiPropertyOptional({
    description: 'Search by parent name',
    example: 'Ananya',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Alias for search by parent name',
    example: 'Ananya',
  })
  @IsString()
  @IsOptional()
  parentName?: string;

  @ApiPropertyOptional({
    description: 'Search by request ID',
    example: 'VR-2401',
  })
  @IsString()
  @IsOptional()
  requestId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: VisitRequestStatusEnum,
    example: 'PENDING',
  })
  @IsEnum(VisitRequestStatusEnum)
  @IsOptional()
  status?: VisitRequestStatusEnum;

  @ApiPropertyOptional({
    description: 'Filter by risk level',
    enum: RiskLevelEnum,
    example: 'LOW',
  })
  @IsEnum(RiskLevelEnum)
  @IsOptional()
  risk?: RiskLevelEnum;

  @ApiPropertyOptional({
    description: 'Alias for risk level filter',
    enum: RiskLevelEnum,
    example: 'LOW',
  })
  @IsEnum(RiskLevelEnum)
  @IsOptional()
  riskLevel?: RiskLevelEnum;

  @ApiPropertyOptional({
    description: 'Filter by visit date (YYYY-MM-DD)',
    example: '2026-07-20',
  })
  @IsDateString()
  @IsOptional()
  visitDate?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: SortByEnum,
    default: 'createdAt',
  })
  @IsEnum(SortByEnum)
  @IsOptional()
  sortBy?: SortByEnum = SortByEnum.createdAt;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrderEnum,
    default: 'desc',
  })
  @IsEnum(SortOrderEnum)
  @IsOptional()
  sortOrder?: SortOrderEnum = SortOrderEnum.desc;
}
