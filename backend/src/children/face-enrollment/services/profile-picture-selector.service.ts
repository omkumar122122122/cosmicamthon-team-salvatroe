import { Injectable, Logger } from '@nestjs/common';
import { ProcessFrameDto } from '../dto/process-frame.dto';
import { FacialPoseType } from '../interfaces/face-quality.interface';

@Injectable()
export class ProfilePictureSelectorService {
  private readonly logger = new Logger(ProfilePictureSelectorService.name);

  /**
   * Evaluates all captured pose frames and selects the highest-scoring smiling posture image
   * (or front-facing neutral image as fallback) to be set as the child's official profile photo.
   */
  selectBestProfileImage(frames: ProcessFrameDto[]): {
    bestImageUrl: string;
    selectedPose: FacialPoseType;
    score: number;
  } {
    if (!frames || frames.length === 0) {
      return {
        bestImageUrl: '/uploads/children/default-avatar.png',
        selectedPose: FacialPoseType.FRONT_NEUTRAL,
        score: 0,
      };
    }

    // Helper predicate to match smiling posture frames
    const isSmilingFrame = (f: ProcessFrameDto) => {
      const poseStr = String(f.pose || '').toLowerCase().trim();
      return (
        poseStr === 'front_smiling' ||
        poseStr === 'smile' ||
        poseStr === 'smiling' ||
        poseStr === 'front_smile' ||
        (f as any).smileScore > 50
      );
    };

    // Helper predicate to match neutral front frames
    const isNeutralFrame = (f: ProcessFrameDto) => {
      const poseStr = String(f.pose || '').toLowerCase().trim();
      return (
        poseStr === 'front_neutral' ||
        poseStr === 'front' ||
        poseStr === 'neutral'
      );
    };

    // 1. Prioritize FRONT_SMILING pose image
    const smilingFrames = frames.filter(isSmilingFrame);

    if (smilingFrames.length > 0) {
      const bestSmiling = this.pickHighestQualityFrame(smilingFrames);
      this.logger.log(`Selected FRONT_SMILING posture image as child profile picture with quality score ${bestSmiling.calculatedScore}`);
      return {
        bestImageUrl: bestSmiling.imageBase64,
        selectedPose: FacialPoseType.FRONT_SMILING,
        score: bestSmiling.calculatedScore,
      };
    }

    // 2. Fallback to FRONT_NEUTRAL pose if no smiling image
    const neutralFrames = frames.filter(isNeutralFrame);

    if (neutralFrames.length > 0) {
      const bestNeutral = this.pickHighestQualityFrame(neutralFrames);
      this.logger.log(`Fallback to FRONT_NEUTRAL image as child profile picture with score ${bestNeutral.calculatedScore}`);
      return {
        bestImageUrl: bestNeutral.imageBase64,
        selectedPose: FacialPoseType.FRONT_NEUTRAL,
        score: bestNeutral.calculatedScore,
      };
    }

    // 3. Fallback to any highest quality captured pose
    const bestAny = this.pickHighestQualityFrame(frames);
    return {
      bestImageUrl: bestAny.imageBase64,
      selectedPose: bestAny.pose,
      score: bestAny.calculatedScore,
    };
  }

  private pickHighestQualityFrame(frames: ProcessFrameDto[]): ProcessFrameDto & { calculatedScore: number } {
    const scored = frames.map((frame) => {
      const lighting = frame.lightingQuality ?? 90;
      const blur = frame.blurScore ?? 90;
      const poseStr = String(frame.pose || '').toLowerCase();
      const isSmile = poseStr.includes('smile');
      const isNeutral = poseStr.includes('neutral') || poseStr === 'front';
      const poseBonus = isSmile ? 25 : isNeutral ? 10 : 0;
      const score = Math.round((lighting * 0.4) + (blur * 0.4) + poseBonus);
      return { ...frame, calculatedScore: score };
    });

    scored.sort((a, b) => b.calculatedScore - a.calculatedScore);
    return scored[0];
  }
}
