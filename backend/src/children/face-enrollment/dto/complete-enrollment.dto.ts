import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessFrameDto } from './process-frame.dto';

export class CompleteEnrollmentDto {
  @ApiProperty({ example: 'child-uuid-1234' })
  @IsString()
  @IsNotEmpty()
  childId: string;

  @ApiProperty({ example: [0.012, -0.045], required: false })
  @IsOptional()
  @IsArray()
  masterEmbedding?: number[];

  @ApiProperty({ type: [ProcessFrameDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcessFrameDto)
  capturedFrames: ProcessFrameDto[];
}

export class CompleteEnrollmentResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'AI Face Enrollment completed successfully' })
  message: string;

  @ApiProperty({ example: 'Completed' })
  aiEnrollmentStatus: string;

  @ApiProperty({ example: true })
  attendanceReady: boolean;

  @ApiProperty({ example: true })
  faceVerified: boolean;

  @ApiProperty({ example: 97.4 })
  enrollmentQualityScore: number;

  @ApiProperty({ example: 'https://storage.example.com/photos/child-profile-smile.jpg' })
  profileImageUrl: string;
}
