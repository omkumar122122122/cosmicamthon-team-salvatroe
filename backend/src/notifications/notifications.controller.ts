import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  QueryNotificationDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  UnreadCountDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a notification (ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({ type: CreateNotificationDto })
  create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT, Role.SOCIAL_WORKER, Role.DONOR)
  @ApiOperation({ summary: 'Get user\'s notifications with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: NotificationListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query() queryDto: QueryNotificationDto,
    @CurrentUser('sub') userId: string,
  ): Promise<NotificationListResponseDto> {
    return this.notificationsService.findAll(queryDto, userId);
  }

  @Get('unread-count')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT, Role.SOCIAL_WORKER, Role.DONOR)
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    type: UnreadCountDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUnreadCount(
    @CurrentUser('sub') userId: string,
  ): Promise<UnreadCountDto> {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT, Role.SOCIAL_WORKER, Role.DONOR)
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your notification' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.findOne(id, userId);
  }

  @Patch(':id/read')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT, Role.SOCIAL_WORKER, Role.DONOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your notification' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.notificationsService.markAsRead(id, userId);
    return { message: 'Notification marked as read' };
  }

  @Patch('read-all')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT, Role.SOCIAL_WORKER, Role.DONOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    const result = await this.notificationsService.markAllAsRead(userId);
    return {
      message: `Marked ${result.count} notifications as read`,
      count: result.count,
    };
  }

  @Delete('clear-read/all')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT, Role.SOCIAL_WORKER, Role.DONOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all read notifications' })
  @ApiResponse({
    status: 200,
    description: 'Read notifications cleared successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearRead(@CurrentUser('sub') userId: string) {
    const result = await this.notificationsService.clearRead(userId);
    return {
      message: `Cleared ${result.count} read notifications`,
      count: result.count,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT, Role.SOCIAL_WORKER, Role.DONOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your notification' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.notificationsService.delete(id, userId);
    return { message: 'Notification deleted successfully' };
  }

}
