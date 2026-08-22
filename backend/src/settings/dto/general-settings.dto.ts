import { IsString, IsOptional, IsEmail, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GeneralSettingsDto {
  @ApiPropertyOptional({ example: 'Orphan Age Child Safety System' })
  @IsOptional()
  @IsString()
  systemName?: string;

  @ApiPropertyOptional({ example: 'Child Welfare Organization' })
  @IsOptional()
  @IsString()
  organizationName?: string;

  @ApiPropertyOptional({ example: 'contact@example.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+1 234 567 8900' })
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional({ example: '123 Main St, City, Country' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'UTC', enum: ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata'] })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'MM/DD/YYYY', enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MMM-YYYY'] })
  @IsOptional()
  @IsIn(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MMM-YYYY'])
  dateFormat?: string;

  @ApiPropertyOptional({ example: 'en', enum: ['en', 'es', 'fr', 'de', 'hi'] })
  @IsOptional()
  @IsIn(['en', 'es', 'fr', 'de', 'hi'])
  language?: string;
}
