export enum FacialPoseType {
  FRONT_NEUTRAL = 'FRONT_NEUTRAL',
  FRONT_SMILING = 'FRONT_SMILING',
  LEFT_PROFILE = 'LEFT_PROFILE',
  RIGHT_PROFILE = 'RIGHT_PROFILE',
  LOOK_UP = 'LOOK_UP',
  LOOK_DOWN = 'LOOK_DOWN',
  BLINK_LIVENESS = 'BLINK_LIVENESS',
}

export interface IFaceQualityMetrics {
  facesDetected: number;
  isCentered: boolean;
  lightingQualityScore: number; // 0 - 100
  blurScore: number;            // 0 - 100 (higher is sharper)
  resolutionWidth: number;
  resolutionHeight: number;
  eyesVisible: boolean;
  eyesOpenScore: number;        // 0 - 100
  smileScore: number;           // 0 - 100
  livenessVerified: boolean;
}

export interface IFaceQualityValidationResult {
  isValid: boolean;
  qualityScore: number;
  errors: string[];
  metrics: IFaceQualityMetrics;
}

export interface ICapturedPoseFrame {
  pose: FacialPoseType;
  imageBase64OrUrl: string;
  qualityScore: number;
  smileScore?: number;
  eyesOpenScore?: number;
  capturedAt: Date;
}
