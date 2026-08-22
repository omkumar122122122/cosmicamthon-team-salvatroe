import { IsBoolean, IsNumber, IsOptional, IsArray, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SecuritySettingsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  helmet?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  rateLimiter?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  cors?: boolean;

  @ApiPropertyOptional({ example: ['https://example.com', 'https://app.example.com'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedOrigins?: string[];

  @ApiPropertyOptional({ example: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100, description: 'Maximum upload size in MB' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxUploadSize?: number;
}
