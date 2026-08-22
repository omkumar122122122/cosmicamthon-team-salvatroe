import { IsBoolean, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AISettingsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableAI?: boolean;

  @ApiPropertyOptional({ example: 'gemini-1.5-flash', enum: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4', 'gpt-3.5-turbo'] })
  @IsOptional()
  @IsString()
  @IsIn(['gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4', 'gpt-3.5-turbo'])
  defaultAIModel?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  riskAnalysis?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  faceRecognition?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  conversationAnalysis?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoRiskDetection?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoRecommendations?: boolean;
}
