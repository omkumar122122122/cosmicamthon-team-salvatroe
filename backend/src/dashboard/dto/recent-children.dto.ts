import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecentChildDto {
  @ApiProperty({ example: 'CH-1021' })
  id: string;

  @ApiProperty({ example: 'Ishaan Roy' })
  name: string;

  @ApiProperty({ example: 'Sunrise Care Home' })
  orphanage: string;

  @ApiProperty({ example: 'Low' })
  risk: string;

  @ApiProperty({ example: '96%' })
  attendance: string;

  @ApiPropertyOptional()
  photo?: string | null;
}

export class RecentChildrenDto {
  @ApiProperty({ type: [RecentChildDto] })
  children: RecentChildDto[];

  @ApiProperty({ example: 1248 })
  total: number;
}
