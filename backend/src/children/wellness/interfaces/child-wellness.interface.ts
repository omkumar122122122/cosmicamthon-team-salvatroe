import { RawEmotion } from '../enums/raw-emotion.enum';
import { WellnessClassification } from '../enums/wellness-classification.enum';

export interface IEmotionDetectionResult {
  primaryEmotion: RawEmotion;
  confidenceScore: number; // 0 - 100
  emotionScores: Record<RawEmotion, number>;
  analyzedAt: Date;
}

export interface IChildWellnessEvaluation {
  childId: string;
  childCode: string;
  childName: string;
  sessionId?: string;
  wellnessScore: number;       // 0 - 100
  classification: WellnessClassification;
  primaryEmotion: RawEmotion;
  emotionConfidence: number;
  consecutiveNegativeDays: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  alertTriggered: boolean;
  alertId?: string;
  evaluatedAt: Date;
}

export interface IWellnessSummaryReport {
  orphanageId: string;
  orphanageName: string;
  totalChildrenAnalyzed: number;
  normalCount: number;
  needsObservationCount: number;
  needsAttentionCount: number;
  averageWellnessScore: number;
  activeAlertsCount: number;
  evaluatedAt: Date;
}
