import { ApiProperty } from '@nestjs/swagger';

export class AIInsightDto {
  @ApiProperty({ example: 'AI Safety Score' })
  label: string;

  @ApiProperty({ example: '94%' })
  value: string;

  @ApiProperty({ example: true })
  up: boolean;
}

export class StatCardDto {
  @ApiProperty({ example: 'Registered Children' })
  label: string;

  @ApiProperty({ example: '1,248' })
  value: string;

  @ApiProperty({ example: '+8.2%' })
  trend: string;

  @ApiProperty({ example: 'blue' })
  tone: string;
}

export class AdminStatsDto {
  @ApiProperty({ type: [AIInsightDto] })
  aiInsights: AIInsightDto[];

  @ApiProperty({ type: [StatCardDto] })
  stats: StatCardDto[];

  @ApiProperty({ example: 'Operational' })
  systemStatus: string;

  @ApiProperty({ example: 'Active' })
  aiModelStatus: string;
}
