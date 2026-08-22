import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, IsEnum } from 'class-validator';
import { OtpPurpose } from '../../common/enums/role.enum';

export class VerifyOtpDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'OTP code is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  code: string;

  @ApiProperty({
    enum: OtpPurpose,
    example: OtpPurpose.TWO_FACTOR_AUTH,
    description: 'The purpose this OTP was issued for',
  })
  @IsEnum(OtpPurpose, { message: 'Invalid OTP purpose' })
  purpose: OtpPurpose;
}
