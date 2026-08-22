import { IsNumber, IsBoolean, IsOptional, ValidateNested, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class PasswordPolicyDto {
  @ApiPropertyOptional({ example: 8, minimum: 6, maximum: 20 })
  @IsOptional()
  @IsNumber()
  @Min(6)
  @Max(20)
  minLength?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requireUppercase?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requireLowercase?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requireNumber?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requireSpecialChar?: boolean;
}

export class AuthenticationSettingsDto {
  @ApiPropertyOptional({ example: 60, minimum: 5, maximum: 1440, description: 'JWT expiry in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440)
  jwtExpiry?: number;

  @ApiPropertyOptional({ example: 7, minimum: 1, maximum: 90, description: 'Refresh token expiry in days' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  refreshTokenExpiry?: number;

  @ApiPropertyOptional({ example: 5, minimum: 3, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(10)
  maxLoginAttempts?: number;

  @ApiPropertyOptional({ example: 30, minimum: 5, maximum: 1440, description: 'Account lock duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440)
  accountLockDuration?: number;

  @ApiPropertyOptional({ example: 30, minimum: 5, maximum: 480, description: 'Session timeout in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(480)
  sessionTimeout?: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 15, description: 'OTP expiry in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(15)
  otpExpiry?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @ApiPropertyOptional({ type: PasswordPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PasswordPolicyDto)
  passwordPolicy?: PasswordPolicyDto;
}
