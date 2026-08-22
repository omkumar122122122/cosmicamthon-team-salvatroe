import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { NotificationType, NotificationChannel } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to send notification to',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: 'ADOPTION_STATUS_CHANGED',
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiPropertyOptional({
    description: 'Notification channel',
    enum: NotificationChannel,
    default: 'IN_APP',
  })
  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel = NotificationChannel.IN_APP;

  @ApiProperty({
    description: 'Notification title',
    example: 'Visit Request Approved',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification body/message',
    example: 'Your visit request for Sunrise Care Home has been approved.',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({
    description: 'Related entity type (e.g., VisitRequest, Child, Parent)',
    example: 'VisitRequest',
  })
  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @ApiPropertyOptional({
    description: 'Related entity ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsOptional()
  relatedEntityId?: string;
}
