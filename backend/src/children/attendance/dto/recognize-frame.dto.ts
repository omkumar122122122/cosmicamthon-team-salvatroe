import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class RecognizeAttendanceFrameDto {
  @ApiProperty({ example: 'session-uuid-1234' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...' })
  @IsString()
  @IsNotEmpty()
  imageBase64: string;

  @ApiPropertyOptional({ example: 'CAM-01-MAIN' })
  @IsOptional()
  @IsString()
  cameraId?: string;

  @ApiPropertyOptional({ example: 98 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceOverride?: number;
}

export class RecognizeAttendanceFrameResponseDto {
  @ApiProperty({ example: true })
  recognized: boolean;

  @ApiPropertyOptional({ example: 'child-uuid-1234' })
  childId?: string;

  @ApiPropertyOptional({ example: 'CH-2026-00125' })
  childCode?: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  childName?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/photos/child.jpg' })
  childPhoto?: string;

  @ApiProperty({ example: 98.4 })
  confidenceScore: number;

  @ApiProperty({ example: true })
  isDuplicateCheckin: boolean;

  @ApiProperty({ example: 'PRESENT' })
  status: string;

  @ApiPropertyOptional({ example: 88 })
  wellnessScore?: number;

  @ApiPropertyOptional({ example: 'NORMAL' })
  classification?: string;

  @ApiPropertyOptional({ example: 'Happy' })
  primaryEmotion?: string;
}
