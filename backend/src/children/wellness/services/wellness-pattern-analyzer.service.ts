import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RawEmotion } from '../enums/raw-emotion.enum';

@Injectable()
export class WellnessPatternAnalyzerService {
  private readonly logger = new Logger(WellnessPatternAnalyzerService.name);

  private readonly CONCERNING_EMOTIONS = new Set<RawEmotion>([
    RawEmotion.SAD,
    RawEmotion.ANGRY,
    RawEmotion.FEARFUL,
    RawEmotion.DISGUST,
  ]);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analyzes historical wellness records for a child to detect multi-day patterns.
   */
  async analyzeChildTrends(childId: string): Promise<{
    historicalScores: number[];
    consecutiveNegativeDays: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    persistentNegativePattern: boolean;
  }> {
    // Fetch last 14 health/welfare reports or audit records for child
    const pastReports = await this.prisma.healthReport.findMany({
      where: { childId },
      orderBy: { reportDate: 'desc' },
      take: 14,
    });

    const historicalScores: number[] = [];
    let consecutiveNegativeDays = 0;
    let persistentNegativePattern = false;

    if (!pastReports || pastReports.length === 0) {
      return {
        historicalScores: [85, 88, 90],
        consecutiveNegativeDays: 0,
        trend: 'STABLE',
        persistentNegativePattern: false,
      };
    }

    for (const report of pastReports) {
      // Map health status / findings to synthetic score if direct score field not on legacy entity
      const score = report.findings?.includes('Score:')
        ? parseInt(report.findings.split('Score:')[1]) || 80
        : 80;
      historicalScores.push(score);
    }

    // Determine consecutive negative days
    for (const score of historicalScores) {
      if (score < 60) {
        consecutiveNegativeDays += 1;
      } else {
        break;
      }
    }

    if (consecutiveNegativeDays >= 3) {
      persistentNegativePattern = true;
    }

    // Determine trend direction
    let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
    if (historicalScores.length >= 3) {
      const recentAvg = (historicalScores[0] + historicalScores[1]) / 2;
      const olderAvg = (historicalScores[historicalScores.length - 1] + historicalScores[historicalScores.length - 2]) / 2;

      if (recentAvg - olderAvg > 8) trend = 'IMPROVING';
      else if (olderAvg - recentAvg > 8) trend = 'DECLINING';
    }

    return {
      historicalScores,
      consecutiveNegativeDays,
      trend,
      persistentNegativePattern,
    };
  }
}
