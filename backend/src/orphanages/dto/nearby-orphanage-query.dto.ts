import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class NearbyOrphanageQueryDto {
  @ApiProperty({ description: 'Latitude between -90 and 90', example: 28.6139 })
  @IsNotEmpty({ message: 'Latitude is required' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  lat: number;

  @ApiProperty({ description: 'Longitude between -180 and 180', example: 77.2090 })
  @IsNotEmpty({ message: 'Longitude is required' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude must be a valid number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  lng: number;

  @ApiProperty({
    description: 'Radius in kilometers (5, 10, 25, 50, or 100) or meters (5000, 10000, 25000, 50000, 100000)',
    example: 10,
    default: 10,
  })
  @IsNotEmpty({ message: 'Radius is required' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Radius must be a number' })
  @IsIn([5, 10, 25, 50, 100, 5000, 10000, 25000, 50000, 100000], {
    message: 'Radius must be one of 5, 10, 25, 50, or 100 km',
  })
  radius: number = 10;
}
