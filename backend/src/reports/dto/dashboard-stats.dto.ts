import { ApiProperty } from '@nestjs/swagger';

export class MetricDto {
  @ApiProperty({ example: '94%', description: 'Metric value as formatted string' })
  value: string;

  @ApiProperty({ example: '+2.1%', description: 'Trend indicator with +/- sign' })
  trend: string;

  @ApiProperty({ example: 'up', enum: ['up', 'down', 'neutral'], description: 'Trend direction' })
  direction: 'up' | 'down' | 'neutral';
}

export class DashboardStatsDto {
  @ApiProperty({ type: MetricDto, description: 'AI Safety Score metric' })
  aiSafetyScore: MetricDto;

  @ApiProperty({ type: MetricDto, description: 'Compliance Rate metric' })
  complianceRate: MetricDto;

  @ApiProperty({ type: MetricDto, description: 'High Risk Children percentage' })
  highRiskChildren: MetricDto;

  @ApiProperty({ type: MetricDto, description: 'Average Attendance percentage' })
  avgAttendance: MetricDto;
}
