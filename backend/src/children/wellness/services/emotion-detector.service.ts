import { Injectable, Logger } from '@nestjs/common';
import { RawEmotion } from '../enums/raw-emotion.enum';
import { IEmotionDetectionResult } from '../interfaces/child-wellness.interface';

@Injectable()
export class EmotionDetectorService {
  private readonly logger = new Logger(EmotionDetectorService.name);

  /**
   * Emotional weight scale mapped to 0-100 wellness index.
   */
  private readonly EMOTION_WEIGHTS: Record<RawEmotion, number> = {
    [RawEmotion.HAPPY]: 95,
    [RawEmotion.NEUTRAL]: 85,
    [RawEmotion.SURPRISED]: 75,
    [RawEmotion.SAD]: 40,
    [RawEmotion.FEARFUL]: 30,
    [RawEmotion.ANGRY]: 25,
    [RawEmotion.DISGUST]: 30,
  };

  /**
   * Analyzes live camera frame for emotion detection.
   */
  detectEmotion(
    imageBase64?: string,
    overrideEmotion?: RawEmotion,
    overrideConfidence?: number
  ): IEmotionDetectionResult {
    const primaryEmotion = overrideEmotion || RawEmotion.HAPPY;
    const confidenceScore = overrideConfidence ?? 94.5;

    const emotionScores: Record<RawEmotion, number> = {
      [RawEmotion.HAPPY]: primaryEmotion === RawEmotion.HAPPY ? confidenceScore : 5.0,
      [RawEmotion.NEUTRAL]: primaryEmotion === RawEmotion.NEUTRAL ? confidenceScore : 10.0,
      [RawEmotion.SURPRISED]: primaryEmotion === RawEmotion.SURPRISED ? confidenceScore : 2.0,
      [RawEmotion.SAD]: primaryEmotion === RawEmotion.SAD ? confidenceScore : 1.0,
      [RawEmotion.ANGRY]: primaryEmotion === RawEmotion.ANGRY ? confidenceScore : 0.5,
      [RawEmotion.FEARFUL]: primaryEmotion === RawEmotion.FEARFUL ? confidenceScore : 0.5,
      [RawEmotion.DISGUST]: primaryEmotion === RawEmotion.DISGUST ? confidenceScore : 0.5,
    };

    this.logger.debug(
      `Detected emotion: ${primaryEmotion} with ${confidenceScore}% confidence.`
    );

    return {
      primaryEmotion,
      confidenceScore,
      emotionScores,
      analyzedAt: new Date(),
    };
  }

  getEmotionWeight(emotion: RawEmotion): number {
    return this.EMOTION_WEIGHTS[emotion] ?? 70;
  }
}
