import { ApiProperty } from '@nestjs/swagger';

export class ChildDemographicAnalyticsDto {
  @ApiProperty({ example: 45 })
  totalChildren: number;

  @ApiProperty({ example: 42 })
  activeChildren: number;

  @ApiProperty({ example: 3 })
  archivedChildren: number;

  @ApiProperty({ example: { MALE: 24, FEMALE: 20, OTHER: 1, UNKNOWN: 0 } })
  genderBreakdown: Record<string, number>;

  @ApiProperty({ example: { HEALTHY: 38, UNDER_TREATMENT: 4, CRITICAL: 1, UNKNOWN: 2 } })
  healthStatusBreakdown: Record<string, number>;

  @ApiProperty({ example: { '0-3': 5, '4-7': 15, '8-12': 18, '13-18': 7 } })
  ageBrackets: Record<string, number>;

  @ApiProperty({ example: 95.5 })
  aiFaceEnrollmentRatePercent: number;

  @ApiProperty({ example: 4 })
  totalTransfersExecuted: number;
}
