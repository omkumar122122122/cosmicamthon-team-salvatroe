import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class AnswerItemDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'Child / Parent Answer' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ description: 'Sentiment (POSITIVE, NEUTRAL, NEGATIVE)' })
  @IsString()
  @IsOptional()
  sentiment?: string;

  @ApiPropertyOptional({ description: 'AI confidence score (0 to 1)' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  confidence?: number;
}

export class SubmitAssessmentDto {
  @ApiProperty({ description: 'Assessment ID' })
  @IsString()
  @IsNotEmpty()
  assessmentId: string;

  @ApiProperty({ type: [AnswerItemDto], description: 'List of answered questions' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];

  @ApiPropertyOptional({ description: 'Face analysis score (0 to 100)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  faceScore?: number;

  @ApiPropertyOptional({ description: 'Voice analysis score (0 to 100)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  voiceScore?: number;

  @ApiPropertyOptional({ description: 'Behavior observation score (0 to 100)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  behaviorScore?: number;
}
