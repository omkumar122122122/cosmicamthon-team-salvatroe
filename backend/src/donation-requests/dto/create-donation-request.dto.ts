import { IsString, IsNotEmpty, IsInt, Min, IsDateString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const DONATION_TYPES = [
  'Food',
  'Clothes',
  'Books',
  'School Supplies',
  'Toys',
  'Medicine',
  'Furniture',
  'Other',
];

export class CreateDonationRequestDto {
  @ApiProperty({ description: 'Orphanage ID to donate to' })
  @IsString()
  @IsNotEmpty()
  orphanageId: string;

  @ApiProperty({ enum: DONATION_TYPES, description: 'Type of physical donation' })
  @IsString()
  @IsIn(DONATION_TYPES, { message: `donationType must be one of: ${DONATION_TYPES.join(', ')}` })
  donationType: string;

  @ApiProperty({ description: 'Quantity of items to donate', minimum: 1 })
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({ description: 'Preferred date for donation drop-off (ISO 8601)' })
  @IsDateString()
  preferredDate: string;

  @ApiProperty({ description: 'Preferred time for donation drop-off (e.g. 10:00 AM)' })
  @IsString()
  @IsNotEmpty()
  preferredTime: string;

  @ApiProperty({ required: false, description: 'Optional personal message' })
  @IsOptional()
  @IsString()
  message?: string;
}
