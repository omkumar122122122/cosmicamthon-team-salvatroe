import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  IsIn,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateOrphanageDto {
  // Section 1: Organization Details
  @ApiProperty({ example: 'Sunrise Care Home' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'REG-DL-2026-001' })
  @IsString()
  registrationNumber: string;

  @ApiPropertyOptional({ example: 'GOV-CW-DEL-001' })
  @IsOptional()
  @IsString()
  governmentLicenseNumber?: string;

  @ApiPropertyOptional({ example: '2012-06-18' })
  @IsOptional()
  @IsDateString()
  establishmentDate?: string;

  @ApiProperty({ example: 'NGO', enum: ['NGO', 'GOVERNMENT', 'TRUST', 'SOCIETY', 'PRIVATE', 'RELIGIOUS'] })
  @IsString()
  @IsIn(['NGO', 'GOVERNMENT', 'TRUST', 'SOCIETY', 'PRIVATE', 'RELIGIOUS'])
  organizationType: string;

  @ApiPropertyOptional({ example: 164 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numberOfChildren?: number;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  capacity?: number;

  // Section 2: Contact Information
  @ApiProperty({ example: 'office@sunrisecare.org' })
  @IsEmail()
  officialEmail: string;

  @ApiProperty({ example: '+919876540001' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: '+919876540002' })
  @IsOptional()
  @IsString()
  alternativeContact?: string;

  @ApiPropertyOptional({ example: 'https://sunrisecare.org' })
  @IsOptional()
  @IsString()
  website?: string;

  // Section 3: Address
  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  state: string;

  @ApiPropertyOptional({ example: 'South Delhi' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: '110017' })
  @IsOptional()
  @IsString()
  pinCode?: string;

  @ApiPropertyOptional({ example: '21 Welfare Road, Saket, New Delhi' })
  @IsOptional()
  @IsString()
  fullAddress?: string;

  // Section 4: Administrator Details
  @ApiPropertyOptional({ example: 'Rohan Verma' })
  @IsOptional()
  @IsString()
  administratorName?: string;

  @ApiPropertyOptional({ example: 'Home Administrator' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: '+919876540003' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: 'admin@sunrisecare.org' })
  @IsOptional()
  @IsEmail()
  administratorEmail?: string;

  // Section 6: Child Information Summary
  @ApiPropertyOptional({ example: 91 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBoys?: number;

  @ApiPropertyOptional({ example: 73 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalGirls?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  below5?: number;

  @ApiPropertyOptional({ example: 96 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  age5To12?: number;

  @ApiPropertyOptional({ example: 44 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  above12?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  specialNeeds?: number;

  // Section 7: Staff Details
  @ApiPropertyOptional({ example: 46 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalStaff?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  caretakers?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  teachers?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  medicalStaff?: number;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityGuards?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volunteers?: number;

  // Section 9: Emergency Contact
  @ApiPropertyOptional({ example: 'Anita Rao' })
  @IsOptional()
  @IsString()
  emergencyContactPerson?: string;

  @ApiPropertyOptional({ example: '+919876540004' })
  @IsOptional()
  @IsString()
  emergencyMobile?: string;

  @ApiPropertyOptional({ example: 'emergency@sunrisecare.org' })
  @IsOptional()
  @IsEmail()
  emergencyEmail?: string;

  @ApiPropertyOptional({ example: 'Emergency Response Officer' })
  @IsOptional()
  @IsString()
  emergencyRelationship?: string;

  // Section 10: AI Safety Details
  @ApiPropertyOptional({ example: 'Yes', enum: ['Yes', 'No'] })
  @IsOptional()
  @IsIn(['Yes', 'No'])
  faceRecognitionEnabled?: string;

  @ApiPropertyOptional({ example: 'Yes', enum: ['Yes', 'No'] })
  @IsOptional()
  @IsIn(['Yes', 'No'])
  cctvInstalled?: string;

  @ApiPropertyOptional({ example: 38 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numberOfCameras?: number;

  @ApiPropertyOptional({ example: 'Yes', enum: ['Yes', 'No'] })
  @IsOptional()
  @IsIn(['Yes', 'No'])
  visitorFaceVerificationEnabled?: string;

  @ApiPropertyOptional({ example: 'Biometric and face recognition' })
  @IsOptional()
  @IsString()
  childAttendanceSystem?: string;

  @ApiPropertyOptional({ example: 'Yes', enum: ['Yes', 'No'] })
  @IsOptional()
  @IsIn(['Yes', 'No'])
  gpsTrackingAvailable?: string;

  @ApiPropertyOptional({ example: 'Yes', enum: ['Yes', 'No'] })
  @IsOptional()
  @IsIn(['Yes', 'No'])
  emergencyAlertSystemEnabled?: string;

  // Section 11: Bank Details
  @ApiPropertyOptional({ example: 'State Bank of India' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'Sunrise Care Home' })
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'SBIN0001482' })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional({ example: '07SUNRISE1234Z1Z' })
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional({ example: 'AAACT1234C' })
  @IsOptional()
  @IsString()
  panCard?: string;

  // Section 13: Login Credentials - Password for orphanage account
  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'SecurePassword123!' })
  @IsOptional()
  @IsString()
  confirmPassword?: string;

  // Section 9: Facilities (FIX-2)
  @ApiPropertyOptional({
    example: ['Medical Room', 'CCTV Surveillance', 'School'],
    type: [String],
  })
  @IsOptional()
  facilities?: string | string[];
}
