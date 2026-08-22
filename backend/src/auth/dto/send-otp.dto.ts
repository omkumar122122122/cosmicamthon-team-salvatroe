import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OtpPurpose } from '../../common/enums/role.enum';

export class SendOtpDto {
  @ApiProperty({
    enum: OtpPurpose,
    example: OtpPurpose.TWO_FACTOR_AUTH,
    description: 'The purpose for which the OTP should be generated',
  })
  @IsEnum(OtpPurpose, { message: 'Invalid OTP purpose' })
  purpose: OtpPurpose;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'Phone number for SMS delivery (required if deliveryType is "sms")',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
