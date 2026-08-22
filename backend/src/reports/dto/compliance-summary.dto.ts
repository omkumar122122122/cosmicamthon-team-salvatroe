import { ApiProperty } from '@nestjs/swagger';

export class ComplianceMetricDto {
  @ApiProperty({ example: '34/36', description: 'Metric value as ratio or percentage' })
  value: string;

  @ApiProperty({ example: 95, description: 'Percentage value' })
  percentage: number;

  @ApiProperty({ example: 'Above benchmark', description: 'Status description' })
  status: string;

  @ApiProperty({ 
    example: 'success', 
    enum: ['success', 'warning', 'danger', 'info'],
    description: 'Status color indicator' 
  })
  statusColor: 'success' | 'warning' | 'danger' | 'info';
}

export class ComplianceSummaryDto {
  @ApiProperty({ type: ComplianceMetricDto, description: 'Submitted forms metric' })
  submittedForms: ComplianceMetricDto;

  @ApiProperty({ type: ComplianceMetricDto, description: 'Pending reviews metric' })
  pendingReviews: ComplianceMetricDto;

  @ApiProperty({ type: ComplianceMetricDto, description: 'Inspection score metric' })
  inspectionScore: ComplianceMetricDto;
}
