import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { RawEmotion } from '../enums/raw-emotion.enum';

export class AnalyzeWellnessDto {
  @ApiProperty({ example: 'child-uuid-1234' })
  @IsString()
  @IsNotEmpty()
  childId: string;

  @ApiPropertyOptional({ example: 'session-uuid-1234' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...' })
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiPropertyOptional({ enum: RawEmotion, example: RawEmotion.HAPPY })
  @IsOptional()
  @IsEnum(RawEmotion)
  emotionOverride?: RawEmotion;

  @ApiPropertyOptional({ example: 94 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceOverride?: number;
}

export class AnalyzeWellnessResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Child wellness evaluation completed successfully' })
  message: string;

  @ApiProperty({ example: 'child-uuid-1234' })
  childId: string;

  @ApiProperty({ example: 'CH-2026-00125' })
  childCode: string;

  @ApiProperty({ example: 'Rahul Sharma' })
  childName: string;

  @ApiProperty({ example: 88 })
  wellnessScore: number;

  @ApiProperty({ example: 'NORMAL' })
  classification: string;

  @ApiProperty({ example: 'HAPPY' })
  primaryEmotion: string;

  @ApiProperty({ example: 94.5 })
  emotionConfidence: number;

  @ApiProperty({ example: 'STABLE' })
  trend: string;

  @ApiProperty({ example: false })
  alertTriggered: boolean;
}
