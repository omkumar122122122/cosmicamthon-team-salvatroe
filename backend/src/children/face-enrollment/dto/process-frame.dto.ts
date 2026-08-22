import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { FacialPoseType } from '../interfaces/face-quality.interface';

export class ProcessFrameDto {
  @ApiPropertyOptional({ example: 'child-uuid-1234' })
  @IsString()
  @IsOptional()
  childId?: string;

  @ApiProperty({ enum: FacialPoseType, example: FacialPoseType.FRONT_NEUTRAL })
  @IsEnum(FacialPoseType)
  @IsNotEmpty()
  pose: FacialPoseType;

  @ApiProperty({ example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...' })
  @IsString()
  @IsNotEmpty()
  imageBase64: string;

  @ApiPropertyOptional({ example: 96 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  lightingQuality?: number;

  @ApiPropertyOptional({ example: 98 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  blurScore?: number;
}

export class ProcessFrameResponseDto {
  @ApiProperty({ example: true })
  isValid: boolean;

  @ApiProperty({ example: 96.5 })
  qualityScore: number;

  @ApiProperty({ example: FacialPoseType.FRONT_NEUTRAL })
  pose: FacialPoseType;

  @ApiProperty({ example: [] })
  errors: string[];
}
