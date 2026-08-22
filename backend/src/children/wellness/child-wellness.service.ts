import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChildrenRepository } from '../repositories/children.repository';
import { EmotionDetectorService } from './services/emotion-detector.service';
import { WellnessCalculatorService } from './services/wellness-calculator.service';
import { WellnessPatternAnalyzerService } from './services/wellness-pattern-analyzer.service';
import { WellnessAlertGeneratorService } from './services/wellness-alert-generator.service';
import { AnalyzeWellnessDto, AnalyzeWellnessResponseDto } from './dto/analyze-wellness.dto';
import { WellnessAlertItemDto, ResolveWellnessAlertDto } from './dto/wellness-alert.dto';
import { IWellnessSummaryReport } from './interfaces/child-wellness.interface';
import { AlertStatus, HealthStatus, Role } from '@prisma/client';

@Injectable()
export class ChildWellnessService {
  private readonly logger = new Logger(ChildWellnessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly childrenRepository: ChildrenRepository,
    private readonly emotionDetector: EmotionDetectorService,
    private readonly wellnessCalculator: WellnessCalculatorService,
    private readonly patternAnalyzer: WellnessPatternAnalyzerService,
    private readonly alertGenerator: WellnessAlertGeneratorService
  ) {}

  /**
   * Analyzes child emotion & calculates daily wellness score.
   */
  async analyzeChildWellness(
    dto: AnalyzeWellnessDto,
    userId: string,
    ipAddress?: string
  ): Promise<AnalyzeWellnessResponseDto> {
    const { childId, imageBase64, emotionOverride, confidenceOverride, sessionId } = dto;

    // 1. Fetch Child Details
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: {
        id: true,
        childCode: true,
        firstName: true,
        lastName: true,
        orphanageId: true,
      },
    });

    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found.`);
    }

    const childName = `${child.firstName} ${child.lastName || ''}`.trim();
    const orphanageName = child.orphanageId
      ? await this.childrenRepository.findOrphanageName(child.orphanageId)
      : 'Care Center';

    // 2. Emotion Detection
    const emotionResult = this.emotionDetector.detectEmotion(
      imageBase64,
      emotionOverride,
      confidenceOverride
    );

    // 3. Pattern & Historical Trend Analysis
    const patternResult = await this.patternAnalyzer.analyzeChildTrends(childId);

    // 4. Calculate Daily Wellness Score & Three-Level Classification
    const calculation = this.wellnessCalculator.calculateWellnessScore({
      currentEmotion: emotionResult.primaryEmotion,
      confidenceScore: emotionResult.confidenceScore,
      historicalScores: patternResult.historicalScores,
      consecutiveNegativeDays: patternResult.consecutiveNegativeDays,
    });

    // 5. Evaluate and Generate Alert if required
    const alertResult = await this.alertGenerator.evaluateAndGenerateAlert({
      childId,
      childCode: child.childCode,
      childName,
      orphanageId: child.orphanageId || undefined,
      orphanageName,
      wellnessScore: calculation.score,
      classification: calculation.classification,
      primaryEmotion: emotionResult.primaryEmotion,
      confidenceScore: emotionResult.confidenceScore,
      persistentNegativePattern: patternResult.persistentNegativePattern,
    });

    // 6. Save Daily Health / Wellness Report in Prisma
    let healthEnum: HealthStatus = HealthStatus.HEALTHY;
    if (calculation.score < 50) healthEnum = HealthStatus.CRITICAL;
    else if (calculation.score < 75) healthEnum = HealthStatus.UNDER_TREATMENT;

    await this.prisma.healthReport.create({
      data: {
        childId,
        reportDate: new Date(),
        healthStatus: healthEnum,
        findings: `Emotion: ${emotionResult.primaryEmotion} (${emotionResult.confidenceScore}%) | Score: ${calculation.score} | Category: ${calculation.classification}`,
        diagnosis: `Wellness Classification: ${calculation.classification}`,
        notes: `Analyzed via AI Facial Expression Monitoring during session ${sessionId || 'intake'}`,
        recordedById: userId,
      },
    });

    // 7. Record Audit Log
    await this.childrenRepository.createAuditLog({
      userId,
      action: 'WELLNESS_ANALYSIS_EXECUTED',
      resource: 'Child',
      resourceId: childId,
      details: {
        childCode: child.childCode,
        wellnessScore: calculation.score,
        classification: calculation.classification,
        primaryEmotion: emotionResult.primaryEmotion,
        alertTriggered: alertResult.alertTriggered,
      },
      ipAddress,
    });

    this.logger.log(
      `Child ${child.childCode} (${childName}) wellness evaluated: ${calculation.score}/100 [${calculation.classification}]`
    );

    return {
      statusCode: 200,
      message: 'Child wellness evaluation completed successfully',
      childId,
      childCode: child.childCode,
      childName,
      wellnessScore: calculation.score,
      classification: calculation.classification,
      primaryEmotion: emotionResult.primaryEmotion,
      emotionConfidence: emotionResult.confidenceScore,
      trend: patternResult.trend,
      alertTriggered: alertResult.alertTriggered,
    };
  }

  /**
   * Retrieves open wellness alerts for administrators.
   */
  async getWellnessAlerts(): Promise<WellnessAlertItemDto[]> {
    const alerts = await this.prisma.alert.findMany({
      where: {
        sourceService: 'ChildWellnessService',
        status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
      },
      include: {
        child: {
          select: {
            id: true,
            childCode: true,
            firstName: true,
            lastName: true,
          },
        },
        orphanage: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map((alert: any) => ({
      id: alert.id,
      severity: alert.severity,
      status: alert.status,
      title: alert.title,
      details: alert.details || '',
      childId: alert.childId || '',
      childName: alert.child
        ? `${alert.child.firstName} ${alert.child.lastName || ''}`.trim()
        : 'Unknown Child',
      orphanageName: alert.orphanage?.name || 'Care Center',
      createdAt: alert.createdAt.toISOString(),
    }));
  }

  /**
   * Resolves a wellness alert (Admin only).
   */
  async resolveWellnessAlert(
    dto: ResolveWellnessAlertDto,
    adminUserId: string,
    ipAddress?: string
  ): Promise<{ statusCode: number; message: string }> {
    const { alertId, resolutionNotes } = dto;

    const alertRecord = await this.prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!alertRecord) {
      throw new NotFoundException(`Wellness alert #${alertId} not found.`);
    }

    await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedById: adminUserId,
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes || 'Resolved after staff review & welfare follow-up.',
      },
    });

    // Record Audit Log
    await this.childrenRepository.createAuditLog({
      userId: adminUserId,
      action: 'WELLNESS_ALERT_RESOLVED',
      resource: 'Alert',
      resourceId: alertId,
      details: {
        alertTitle: alertRecord.title,
        resolutionNotes,
      },
      ipAddress,
    });

    this.logger.log(`Wellness Alert #${alertId} resolved by admin user ${adminUserId}`);

    return {
      statusCode: 200,
      message: 'Wellness alert resolved successfully.',
    };
  }

  /**
   * Gets today's wellness summary report for an orphanage.
   */
  async getTodayWellnessSummary(orphanageId: string): Promise<IWellnessSummaryReport> {
    const orphanageName = await this.childrenRepository.findOrphanageName(orphanageId);

    const reportsToday = await this.prisma.healthReport.findMany({
      where: {
        child: { orphanageId },
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    let normalCount = 0;
    let needsObsCount = 0;
    let needsAttnCount = 0;
    let scoreSum = 0;

    for (const r of reportsToday) {
      if (r.diagnosis?.includes('NEEDS_ATTENTION')) {
        needsAttnCount++;
        scoreSum += 45;
      } else if (r.diagnosis?.includes('NEEDS_OBSERVATION')) {
        needsObsCount++;
        scoreSum += 65;
      } else {
        normalCount++;
        scoreSum += 88;
      }
    }

    const total = reportsToday.length || 1;
    const avgScore = Math.round(scoreSum / total);

    const activeAlertsCount = await this.prisma.alert.count({
      where: {
        orphanageId,
        sourceService: 'ChildWellnessService',
        status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
      },
    });

    return {
      orphanageId,
      orphanageName,
      totalChildrenAnalyzed: reportsToday.length,
      normalCount,
      needsObservationCount: needsObsCount,
      needsAttentionCount: needsAttnCount,
      averageWellnessScore: reportsToday.length > 0 ? avgScore : 88,
      activeAlertsCount,
      evaluatedAt: new Date(),
    };
  }
}
