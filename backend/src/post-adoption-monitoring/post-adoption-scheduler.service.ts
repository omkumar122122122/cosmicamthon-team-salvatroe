import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType, RiskLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PostAdoptionMonitoringRepository } from './post-adoption-monitoring.repository';

@Injectable()
export class PostAdoptionSchedulerService {
  private readonly logger = new Logger(PostAdoptionSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PostAdoptionMonitoringRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Daily Cron Job — Runs every day at midnight (00:00)
   * Checks all AssessmentSchedule records for due assessments (nextAssessmentDate <= today).
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyWelfareScheduleCheck(): Promise<void> {
    const startTime = new Date();
    this.logger.log(`Starting Daily Post-Adoption Welfare Schedule Check [${startTime.toISOString()}]...`);

    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // 1. Query all pending/uncompleted schedules due on or before today
      const dueSchedules = await this.prisma.assessmentSchedule.findMany({
        where: {
          nextAssessmentDate: { lte: today },
          completed: false,
        },
        include: {
          child: true,
          adoption: {
            include: {
              adoptiveParent: {
                include: { user: true },
              },
            },
          },
        },
      });

      this.logger.log(`Found ${dueSchedules.length} assessment schedule(s) due for check.`);

      let processedCount = 0;
      let createdAssessmentsCount = 0;
      let notificationsSentCount = 0;
      let stoppedAgeLimitCount = 0;

      for (const schedule of dueSchedules) {
        try {
          const child = schedule.child;
          const childName = `${child.firstName} ${child.lastName || ''}`.trim();
          const childAge = this.calculateChildAge(child.dateOfBirth, child.approximateAge);

          // 2. Stop scheduling if child age >= 16
          if (childAge >= 16) {
            await this.prisma.assessmentSchedule.update({
              where: { id: schedule.id },
              data: { completed: true },
            });
            stoppedAgeLimitCount++;
            this.logger.log(
              `Child ${child.id} (${childName}) has reached age ${childAge} (>= 16). Stopping post-adoption monitoring schedule #${schedule.id}.`,
            );
            continue;
          }

          // 3. Create Pending Assessment session if not already initialized
          let pendingAssessment = await this.prisma.assessment.findFirst({
            where: {
              scheduleId: schedule.id,
            },
          });

          if (!pendingAssessment) {
            const parentId = schedule.adoption?.adoptiveParentId || '';
            pendingAssessment = await this.repository.createAssessment({
              schedule: { connect: { id: schedule.id } },
              child: { connect: { id: child.id } },
              parent: { connect: { id: parentId } },
              assessmentDate: new Date(),
              faceScore: 0,
              voiceScore: 0,
              answerScore: 0,
              behaviorScore: 0,
              overallRisk: RiskLevel.LOW,
              summary: 'Scheduled 6-month welfare assessment session auto-initialized by daily cron automation.',
              recommendation: 'Parent must complete face scan, voice recording, and AI wellness questions.',
            });
            createdAssessmentsCount++;
            this.logger.log(`Auto-created pending Assessment #${pendingAssessment.id} for child ${childName}`);
          }

          // 4. Notify Parent Dashboard (with deduplication check)
          const parentUser = schedule.adoption?.adoptiveParent?.user;
          if (parentUser && parentUser.id) {
            const isNotificationSent = await this.isDeduplicatedNotificationSent(
              parentUser.id,
              schedule.id,
            );

            if (!isNotificationSent) {
              await this.notificationsService.create({
                userId: parentUser.id,
                type: NotificationType.WELFARE_SESSION_REMINDER,
                title: 'Post-Adoption Welfare Assessment Due',
                body: `6-Month Post-Adoption Welfare Assessment is now due for ${childName}. Please complete the assessment wizard.`,
                relatedEntityType: 'AssessmentSchedule',
                relatedEntityId: schedule.id,
              });
              notificationsSentCount++;
              this.logger.log(`Sent welfare assessment notification to parent ${parentUser.email} for child ${childName}`);
            } else {
              this.logger.debug(`Skipped duplicate notification for parent ${parentUser.id} (Schedule #${schedule.id})`);
            }
          }

          processedCount++;
        } catch (itemError: any) {
          this.logger.error(
            `Failed processing schedule #${schedule.id}: ${itemError?.message || itemError}`,
            itemError?.stack,
          );
        }
      }

      const durationMs = Date.now() - startTime.getTime();
      this.logger.log(
        `Completed Daily Welfare Schedule Check in ${durationMs}ms: Processed=${processedCount}, CreatedAssessments=${createdAssessmentsCount}, NotificationsSent=${notificationsSentCount}, StoppedAge16=${stoppedAgeLimitCount}`,
      );
    } catch (globalError: any) {
      this.logger.error(
        `Critical error during daily welfare schedule check: ${globalError?.message || globalError}`,
        globalError?.stack,
      );
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Deduplication check: prevents sending duplicate WELFARE_SESSION_REMINDER
   * for the same schedule to the same parent within 24 hours.
   */
  private async isDeduplicatedNotificationSent(
    userId: string,
    scheduleId: string,
  ): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.WELFARE_SESSION_REMINDER,
        relatedEntityType: 'AssessmentSchedule',
        relatedEntityId: scheduleId,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    return !!existing;
  }

  /**
   * Helper to compute child age
   */
  private calculateChildAge(dob: Date | null, approxAge: number | null): number {
    if (dob) {
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return approxAge || 8;
  }
}
