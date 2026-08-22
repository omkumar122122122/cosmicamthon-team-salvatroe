import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsEnum,
  IsBoolean, IsNumber, MaxLength, Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressType } from '../enums/parent.enums';

export class CreateAddressDto {
  @ApiProperty({ enum: AddressType, example: AddressType.CURRENT })
  @IsEnum(AddressType)
  type: AddressType;

  @ApiProperty({ example: '42, MG Road, Koramangala' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Near Forum Mall' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Opposite HDFC Bank' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  landmark?: string;

  @ApiProperty({ example: 'Bangalore' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ example: 'Bangalore Urban' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiProperty({ example: 'Karnataka' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @ApiProperty({ example: '560034' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'Pincode must be exactly 6 digits' })
  pincode: string;

  @ApiPropertyOptional({ example: 'India', default: 'India' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: true, description: 'Mark as primary address' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 12.9716, description: 'GPS latitude' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: 77.5946, description: 'GPS longitude' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;
}

export class UpdateAddressDto extends CreateAddressDto {}
