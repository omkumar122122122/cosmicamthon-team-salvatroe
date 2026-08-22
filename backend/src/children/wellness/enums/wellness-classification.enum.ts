export enum WellnessClassification {
  NORMAL = 'NORMAL',                     // Score >= 75
  NEEDS_OBSERVATION = 'NEEDS_OBSERVATION', // Score 50 - 74
  NEEDS_ATTENTION = 'NEEDS_ATTENTION',     // Score < 50 or persistent negative trend
}
