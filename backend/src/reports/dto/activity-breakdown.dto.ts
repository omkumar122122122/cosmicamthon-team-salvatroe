import { ApiProperty } from '@nestjs/swagger';

export class ActivityItemDto {
  @ApiProperty({ example: 'Guardian Visits Verified', description: 'Activity label' })
  label: string;

  @ApiProperty({ example: 32, description: 'Activity count' })
  count: number;

  @ApiProperty({ example: 88, description: 'Completion percentage' })
  percentage: number;

  @ApiProperty({ example: 36, description: 'Total expected count' })
  total: number;
}

export class ActivityBreakdownDto {
  @ApiProperty({ 
    type: [ActivityItemDto], 
    description: 'List of activity metrics with progress' 
  })
  activities: ActivityItemDto[];
}
