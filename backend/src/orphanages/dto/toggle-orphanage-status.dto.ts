import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleOrphanageStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
