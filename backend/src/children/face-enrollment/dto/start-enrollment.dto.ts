import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class StartEnrollmentDto {
  @ApiProperty({ example: 'child-uuid-1234' })
  @IsString()
  @IsNotEmpty()
  childId: string;
}

export class StartEnrollmentResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'AI Face Enrollment session initialized' })
  message: string;

  @ApiProperty({
    example: [
      'FRONT_NEUTRAL',
      'FRONT_SMILING',
      'LEFT_PROFILE',
      'RIGHT_PROFILE',
      'LOOK_UP',
      'LOOK_DOWN',
      'BLINK_LIVENESS',
    ],
  })
  requiredPoses: string[];

  @ApiProperty({ example: 'CH-2026-00125' })
  childCode: string;
}
