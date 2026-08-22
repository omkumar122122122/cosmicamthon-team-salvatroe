import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ChildStatus, AdoptionStatus } from '../enums/child.enums';

export class FilterChildrenDto {
  @ApiPropertyOptional({ description: 'Search by name or child code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by orphanage ID' })
  @IsOptional()
  @IsUUID()
  orphanageId?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], description: 'Filter by risk level' })
  @IsOptional()
  @IsString()
  risk?: string;

  @ApiPropertyOptional({ enum: ChildStatus, description: 'Filter by child status' })
  @IsOptional()
  @IsEnum(ChildStatus)
  status?: ChildStatus;

  @ApiPropertyOptional({ enum: AdoptionStatus, description: 'Filter by adoption status' })
  @IsOptional()
  @IsEnum(AdoptionStatus)
  adoptionStatus?: AdoptionStatus;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 8, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 8;

  @ApiPropertyOptional({ default: 'admissionDate' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'admissionDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
