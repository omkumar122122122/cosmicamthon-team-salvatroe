import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, NotificationType, NotificationChannel } from '@prisma/client';
import {
  CreateNotificationDto,
  QueryNotificationDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  UnreadCountDto,
} from './dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        channel: dto.channel || NotificationChannel.IN_APP,
        title: dto.title,
        body: dto.body,
        relatedEntityType: dto.relatedEntityType,
        relatedEntityId: dto.relatedEntityId,
        sentAt: new Date(),
      },
    });

    this.logger.log(
      `Notification created for user ${dto.userId}: ${dto.title}`,
    );

    return this.mapToResponseDto(notification);
  }

  async findAll(
    queryDto: QueryNotificationDto,
    requestUserId: string,
  ): Promise<NotificationListResponseDto> {
    const {
      type,
      isRead,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const where: Prisma.NotificationWhereInput = {
      userId: requestUserId,
      ...(type && { type }),
      ...(isRead !== undefined && { isRead }),
    };

    const skip = (page - 1) * limit;
    const total = await this.prisma.notification.count({ where });

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const unreadCount = await this.prisma.notification.count({
      where: {
        userId: requestUserId,
        isRead: false,
      },
    });

    return {
      data: notifications.map((n) => this.mapToResponseDto(n)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async findOne(
    id: string,
    requestUserId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Verify ownership
    if (notification.userId !== requestUserId) {
      throw new ForbiddenException(
        'You can only view your own notifications',
      );
    }

    return this.mapToResponseDto(notification);
  }

  async markAsRead(id: string, requestUserId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Verify ownership
    if (notification.userId !== requestUserId) {
      throw new ForbiddenException(
        'You can only update your own notifications',
      );
    }

    if (notification.isRead) {
      // Already read, no action needed
      return;
    }

    await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    this.logger.log(`Notification ${id} marked as read by user ${requestUserId}`);
  }

  async markAllAsRead(requestUserId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId: requestUserId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    this.logger.log(
      `Marked ${result.count} notifications as read for user ${requestUserId}`,
    );

    return { count: result.count };
  }

  async delete(id: string, requestUserId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Verify ownership
    if (notification.userId !== requestUserId) {
      throw new ForbiddenException(
        'You can only delete your own notifications',
      );
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    this.logger.log(`Notification ${id} deleted by user ${requestUserId}`);
  }

  async clearRead(requestUserId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        userId: requestUserId,
        isRead: true,
      },
    });

    this.logger.log(
      `Cleared ${result.count} read notifications for user ${requestUserId}`,
    );

    return { count: result.count };
  }

  async getUnreadCount(requestUserId: string): Promise<UnreadCountDto> {
    const unreadCount = await this.prisma.notification.count({
      where: {
        userId: requestUserId,
        isRead: false,
      },
    });

    return { unreadCount };
  }

  // Helper method to send notifications (to be used by other services)
  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    options?: {
      channel?: NotificationChannel;
      relatedEntityType?: string;
      relatedEntityId?: string;
    },
  ): Promise<NotificationResponseDto> {
    return this.create({
      userId,
      type,
      title,
      body,
      channel: options?.channel || NotificationChannel.IN_APP,
      relatedEntityType: options?.relatedEntityType,
      relatedEntityId: options?.relatedEntityId,
    });
  }

  // Helper method to send notifications to multiple users
  async sendBulkNotifications(
    userIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    options?: {
      channel?: NotificationChannel;
      relatedEntityType?: string;
      relatedEntityId?: string;
    },
  ): Promise<{ count: number }> {
    const notifications = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        channel: options?.channel || NotificationChannel.IN_APP,
        title,
        body,
        relatedEntityType: options?.relatedEntityType,
        relatedEntityId: options?.relatedEntityId,
        sentAt: new Date(),
      })),
    });

    this.logger.log(
      `Sent ${notifications.count} bulk notifications: ${title}`,
    );

    return { count: notifications.count };
  }

  private mapToResponseDto(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      channel: notification.channel,
      title: notification.title,
      body: notification.body,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
      isRead: notification.isRead,
      readAt: notification.readAt,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
