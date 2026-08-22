import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional, IsEnum, IsBoolean, IsInt,
  IsString, Min, Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ParentVerificationStatus, IncomeRange,
  EmploymentType, MaritalStatus,
} from '../enums/parent.enums';
import { PARENT_LIMIT_DEFAULT, PARENT_LIMIT_MAX, PARENT_PAGE_DEFAULT } from '../constants/parent.constants';

export class QueryParentDto {
  @ApiPropertyOptional({ example: 1, default: PARENT_PAGE_DEFAULT })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = PARENT_PAGE_DEFAULT;

  @ApiPropertyOptional({ example: 20, default: PARENT_LIMIT_DEFAULT })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(PARENT_LIMIT_MAX)
  @Type(() => Number)
  limit?: number = PARENT_LIMIT_DEFAULT;

  @ApiPropertyOptional({
    example: 'sharma',
    description: 'Full-text search on name, email, occupation, city',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ enum: ParentVerificationStatus })
  @IsOptional()
  @IsEnum(ParentVerificationStatus)
  verificationStatus?: ParentVerificationStatus;

  @ApiPropertyOptional({ enum: IncomeRange })
  @IsOptional()
  @IsEnum(IncomeRange)
  incomeRange?: IncomeRange;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Filter parents who have completed KYC' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  kycApproved?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Filter parents open to special needs children' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  openToSpecialNeeds?: boolean;

  @ApiPropertyOptional({ example: 60, description: 'Minimum trust score (0–100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minTrustScore?: number;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
