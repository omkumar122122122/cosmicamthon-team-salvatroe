import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateOrphanageDto } from './create-orphanage.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateOrphanageDto extends PartialType(CreateOrphanageDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
