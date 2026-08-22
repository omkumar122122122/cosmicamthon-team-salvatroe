import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class QueryScheduleDto {
  @ApiPropertyOptional({ description: 'Filter by adoption ID' })
  @IsString()
  @IsOptional()
  adoptionId?: string;

  @ApiPropertyOptional({ description: 'Filter by child ID' })
  @IsString()
  @IsOptional()
  childId?: string;

  @ApiPropertyOptional({ description: 'Filter by completion status' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limit per page', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}
