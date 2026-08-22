import { Injectable, Logger } from '@nestjs/common';
import { RawEmotion } from '../enums/raw-emotion.enum';
import { WellnessClassification } from '../enums/wellness-classification.enum';
import { EmotionDetectorService } from './emotion-detector.service';

@Injectable()
export class WellnessCalculatorService {
  private readonly logger = new Logger(WellnessCalculatorService.name);

  constructor(private readonly emotionDetector: EmotionDetectorService) {}

  /**
   * Calculates Daily Wellness Score (0 - 100) and maps to the Three-Level Decision System:
   * 🟢 NORMAL: Score >= 75
   * 🟡 NEEDS_OBSERVATION: Score 50 - 74
   * 🔴 NEEDS_ATTENTION: Score < 50
   */
  calculateWellnessScore(params: {
    currentEmotion: RawEmotion;
    confidenceScore: number;
    historicalScores?: number[];
    consecutiveNegativeDays?: number;
  }): {
    score: number;
    classification: WellnessClassification;
  } {
    const { currentEmotion, confidenceScore, historicalScores = [], consecutiveNegativeDays = 0 } = params;

    const baseWeight = this.emotionDetector.getEmotionWeight(currentEmotion);

    // Factor in historical baseline if available (30% weight)
    let avgHistorical = baseWeight;
    if (historicalScores.length > 0) {
      const sum = historicalScores.reduce((a, b) => a + b, 0);
      avgHistorical = sum / historicalScores.length;
    }

    // Calculate raw weighted score
    let calculatedScore = Math.round(baseWeight * 0.7 + avgHistorical * 0.3);

    // Apply penalty for consecutive negative days (-15 points per day)
    if (consecutiveNegativeDays > 0) {
      calculatedScore = Math.max(0, calculatedScore - consecutiveNegativeDays * 15);
    }

    // Apply confidence scaling factor if detection confidence is below 80%
    if (confidenceScore < 80) {
      // Pull score closer to neutral baseline 75 to avoid extreme score on shaky confidence
      calculatedScore = Math.round(calculatedScore * 0.8 + 75 * 0.2);
    }

    const finalScore = Math.min(100, Math.max(0, calculatedScore));

    // Three-Level Classification Mapping
    let classification: WellnessClassification;
    if (finalScore >= 75) {
      classification = WellnessClassification.NORMAL;
    } else if (finalScore >= 50) {
      classification = WellnessClassification.NEEDS_OBSERVATION;
    } else {
      classification = WellnessClassification.NEEDS_ATTENTION;
    }

    this.logger.debug(
      `Calculated Wellness Score: ${finalScore}/100 -> ${classification} (Emotion: ${currentEmotion})`
    );

    return {
      score: finalScore,
      classification,
    };
  }
}
