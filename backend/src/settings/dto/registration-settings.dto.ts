import { IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrationSettingsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowParentRegistration?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowOrphanageRegistration?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requireEmailVerification?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requireAdminApproval?: boolean;

  @ApiPropertyOptional({ example: 'PENDING', enum: ['PENDING', 'ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsIn(['PENDING', 'ACTIVE', 'INACTIVE'])
  defaultUserStatus?: string;
}
