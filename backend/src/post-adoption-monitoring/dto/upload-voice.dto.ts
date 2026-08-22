import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class UploadVoiceDto {
  @ApiProperty({ description: 'Assessment ID' })
  @IsString()
  @IsNotEmpty()
  assessmentId: string;

  @ApiPropertyOptional({ description: 'Base64 audio string (Max 25MB)' })
  @IsString()
  @IsOptional()
  @MaxLength(34000000, { message: 'Audio upload payload exceeds maximum allowed size of 25MB' })
  audioBase64?: string;

  @ApiPropertyOptional({ description: 'Audio URL' })
  @IsString()
  @IsOptional()
  audioUrl?: string;
}
