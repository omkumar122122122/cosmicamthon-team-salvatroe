import { ApiProperty } from '@nestjs/swagger';

export class RiskDatasetDto {
  @ApiProperty({ 
    example: [45, 12, 8, 2], 
    description: 'Data values for each risk level',
    type: [Number]
  })
  data: number[];

  @ApiProperty({ 
    example: [
      'rgba(34, 197, 94, 0.8)',  // Green for Low
      'rgba(251, 191, 36, 0.8)', // Yellow for Medium
      'rgba(249, 115, 22, 0.8)', // Orange for High
      'rgba(239, 68, 68, 0.8)'   // Red for Critical
    ],
    description: 'Background colors for each segment',
    type: [String]
  })
  backgroundColor: string[];

  @ApiProperty({ 
    example: [
      'rgba(34, 197, 94, 1)',
      'rgba(251, 191, 36, 1)',
      'rgba(249, 115, 22, 1)',
      'rgba(239, 68, 68, 1)'
    ],
    description: 'Border colors for each segment',
    type: [String]
  })
  borderColor?: string[];

  @ApiProperty({ example: 2, description: 'Border width' })
  borderWidth?: number;
}

export class RiskDistributionDto {
  @ApiProperty({ 
    example: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'], 
    description: 'Risk level labels',
    type: [String]
  })
  labels: string[];

  @ApiProperty({ 
    type: [RiskDatasetDto], 
    description: 'Chart datasets for doughnut chart' 
  })
  datasets: RiskDatasetDto[];
}
