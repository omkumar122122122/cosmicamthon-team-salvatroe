import { Injectable } from '@nestjs/common';
import { RiskLevel } from '@prisma/client';

export interface RiskEvaluationResult {
  riskScore: number;
  level: RiskLevel;
  reason: string;
}

@Injectable()
export class RiskEngineService {
  calculateRisk(score: number, flagsCount = 0): RiskEvaluationResult {
    if (flagsCount > 1 || score < 60) {
      return { riskScore: 82, level: RiskLevel.HIGH, reason: 'Multiple risk flags or low overall welfare score' };
    }
    if (flagsCount === 1 || score < 75) {
      return { riskScore: 55, level: RiskLevel.MEDIUM, reason: 'Moderate risk indicators detected during assessment' };
    }
    return { riskScore: 12, level: RiskLevel.LOW, reason: 'Child welfare metrics within optimal safe parameters' };
  }
}
