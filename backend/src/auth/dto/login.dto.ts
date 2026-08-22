import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @ApiProperty({ example: 'SecureP@ssw0rd!' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Extends refresh token TTL to 30 days',
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  @ApiPropertyOptional({ description: 'Client user-agent string (auto-populated)' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  /**
   * OTP code for Two-Factor Authentication.
   * Only required when the account has 2FA enabled.
   * On first login with 2FA, omit this field — the server returns
   * { requiresTwoFactor: true } and sends an OTP. Submit the code
   * in a second request to complete login.
   */
  @ApiPropertyOptional({ example: '123456', description: '6-digit 2FA OTP (required if 2FA is enabled)' })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;

  @ApiPropertyOptional({
    example: 'ADMIN',
    description: 'Expected user role for role-based login validation',
  })
  @IsOptional()
  @IsString()
  role?: string;
}
