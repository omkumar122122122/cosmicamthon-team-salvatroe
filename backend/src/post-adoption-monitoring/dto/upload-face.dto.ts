import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class UploadFaceDto {
  @ApiProperty({ description: 'Assessment ID' })
  @IsString()
  @IsNotEmpty()
  assessmentId: string;

  @ApiPropertyOptional({ description: 'Base64 image string (Max 10MB)' })
  @IsString()
  @IsOptional()
  @MaxLength(13500000, { message: 'Image upload payload exceeds maximum allowed size of 10MB' })
  imageBase64?: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
