import { ApiProperty } from '@nestjs/swagger';

export class ChartDatasetDto {
  @ApiProperty({ example: 'Safety Score', description: 'Dataset label' })
  label: string;

  @ApiProperty({ 
    example: [92, 93, 91, 94, 95, 94], 
    description: 'Data points for the dataset',
    type: [Number]
  })
  data: number[];

  @ApiProperty({ example: 'rgb(59, 130, 246)', description: 'Border color for line chart' })
  borderColor: string;

  @ApiProperty({ example: 'rgba(59, 130, 246, 0.1)', description: 'Background color for line chart' })
  backgroundColor?: string;

  @ApiProperty({ example: 2, description: 'Border width' })
  borderWidth?: number;

  @ApiProperty({ example: false, description: 'Fill area under line' })
  fill?: boolean;

  @ApiProperty({ example: 'monotone', description: 'Line tension' })
  tension?: number | string;
}

export class MonthlyTrendDto {
  @ApiProperty({ 
    example: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], 
    description: 'Month labels for x-axis',
    type: [String]
  })
  labels: string[];

  @ApiProperty({ 
    type: [ChartDatasetDto], 
    description: 'Chart datasets (Safety Score and Compliance)' 
  })
  datasets: ChartDatasetDto[];
}
