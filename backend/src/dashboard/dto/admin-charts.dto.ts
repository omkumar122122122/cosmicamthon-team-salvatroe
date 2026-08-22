import { ApiProperty } from '@nestjs/swagger';

export class ChartDatasetDto {
  @ApiProperty({ example: 'Safety Score' })
  label: string;

  @ApiProperty({ example: [88, 89, 91, 89, 92, 93], isArray: true, type: Number })
  data: number[];

  @ApiProperty({ example: '#3B82F6' })
  borderColor: string;
}

export class LineChartDataDto {
  @ApiProperty({ example: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], isArray: true })
  labels: string[];

  @ApiProperty({ type: [ChartDatasetDto] })
  datasets: ChartDatasetDto[];
}

export class DoughnutDatasetDto {
  @ApiProperty({ example: [1150, 78, 20], isArray: true, type: Number })
  data: number[];

  @ApiProperty({ example: ['#10B981', '#F59E0B', '#EF4444'], isArray: true })
  backgroundColor: string[];
}

export class DoughnutChartDataDto {
  @ApiProperty({ example: ['Low', 'Medium', 'High'], isArray: true })
  labels: string[];

  @ApiProperty({ type: [DoughnutDatasetDto] })
  datasets: DoughnutDatasetDto[];
}

export class AdminChartsDto {
  @ApiProperty({ type: LineChartDataDto })
  monthlySafety: LineChartDataDto;

  @ApiProperty({ type: DoughnutChartDataDto })
  riskDistribution: any;
}
