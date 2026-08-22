import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export enum RescheduleReason {
  STAFF_AVAILABILITY = 'Staff availability',
  PARENT_REQUEST = 'Parent request',
  ROOM_MAINTENANCE = 'Room maintenance',
  VERIFICATION_DELAY = 'Verification delay',
  EMERGENCY = 'Emergency',
  WEATHER_CONDITIONS = 'Weather conditions',
  OTHER = 'Other',
}

export class RescheduleVisitRequestDto {
  @ApiProperty({
    description: 'New visit date (YYYY-MM-DD)',
    example: '2026-07-25',
  })
  @IsDateString()
  @IsNotEmpty()
  newDate: string;

  @ApiProperty({
    description: 'New visit time (HH:mm 24-hour format)',
    example: '14:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'newTime must be in HH:mm format (24-hour)',
  })
  newTime: string;

  @ApiProperty({
    description: 'Reason for rescheduling',
    enum: RescheduleReason,
    example: RescheduleReason.STAFF_AVAILABILITY,
  })
  @IsEnum(RescheduleReason)
  @IsNotEmpty()
  reason: RescheduleReason;

  @ApiPropertyOptional({
    description: 'Send notification to parent about reschedule',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  notifyParent?: boolean = true;

  @ApiPropertyOptional({
    description: 'Additional notes about the reschedule',
    example: 'Staff unavailable due to training session',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
