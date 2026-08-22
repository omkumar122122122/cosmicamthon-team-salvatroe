import { estimateLightingQuality, estimateBlurScore } from './cameraUtils';
import { QUALITY_THRESHOLDS } from './constants';

export function evaluateFaceQuality(videoElement, currentPose) {
  const lightingScore = estimateLightingQuality(videoElement);
  const blurScore = estimateBlurScore(videoElement);

  const isValid =
    lightingScore >= QUALITY_THRESHOLDS.MIN_LIGHTING_SCORE &&
    blurScore >= QUALITY_THRESHOLDS.MIN_BLUR_SCORE;

  let feedbackMessage = 'Hold steady.';
  if (lightingScore < QUALITY_THRESHOLDS.MIN_LIGHTING_SCORE) {
    feedbackMessage = 'Increase ambient room lighting.';
  } else if (blurScore < QUALITY_THRESHOLDS.MIN_BLUR_SCORE) {
    feedbackMessage = 'Hold steady to reduce camera blur.';
  }

  return {
    isValid,
    lightingScore,
    blurScore,
    feedbackMessage,
  };
}
