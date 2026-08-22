import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { ChildrenRepository } from '../repositories/children.repository';

@Injectable()
export class ChildRegistrationNotificationService {
  private readonly logger = new Logger(ChildRegistrationNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly childrenRepository: ChildrenRepository
  ) {}

  /**
   * Notifies all Admin users upon successful child registration or session milestone.
   */
  async notifyAdminsOnRegistration(params: {
    childName: string;
    childCode: string;
    orphanageName: string;
    childId: string;
  }): Promise<void> {
    const { childName, childCode, orphanageName, childId } = params;

    const title = 'Child Safety Alert / Update';
    const body = `Child ${childName} (${childCode}) status updated for ${orphanageName}.`;

    try {
      const adminUsers = await this.childrenRepository.findAdminUsers();

      if (!adminUsers || adminUsers.length === 0) {
        this.logger.warn('No active Admin users found to send notification.');
        return;
      }

      for (const admin of adminUsers) {
        try {
          await this.prisma.notification.create({
            data: {
              userId: admin.id,
              type: NotificationType.SYSTEM_ANNOUNCEMENT,
              channel: NotificationChannel.IN_APP,
              title,
              body,
              relatedEntityType: 'Child',
              relatedEntityId: childId,
              sentAt: new Date(),
            },
          });
        } catch (e) {
          // Ignore engine log notice
        }
      }

      this.logger.log(
        `Sent notification to ${adminUsers.length} admin user(s) for child ${childCode}`
      );
    } catch (error) {
      this.logger.error(`Failed to send notification for child ${childCode}:`, error);
    }
  }
}
