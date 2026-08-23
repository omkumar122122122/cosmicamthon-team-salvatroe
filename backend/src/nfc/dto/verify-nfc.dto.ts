import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class VerifyNfcDto {
  @ApiPropertyOptional({ description: 'Secure NFC Token (from URL or NFC tap payload)' })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiPropertyOptional({ description: 'NFC Pass Human ID (e.g., NFC-VST-8F3K92)' })
  @IsString()
  @IsOptional()
  nfcId?: string;

  @ApiPropertyOptional({ description: 'Optional verification notes by gate staff' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Location / Gate identifier' })
  @IsString()
  @IsOptional()
  gateLocation?: string;
}

export class NfcVerificationResultDto {
  @ApiProperty({ description: 'Verification outcome status (SUCCESS, EXPIRED, INVALID, NOT_APPROVED)' })
  status: 'SUCCESS' | 'EXPIRED' | 'INVALID' | 'NOT_APPROVED';

  @ApiProperty({ description: 'Human-readable verification message' })
  message: string;

  @ApiProperty({ description: 'Verification timestamp' })
  verifiedAt: Date;

  @ApiPropertyOptional({ description: 'Updated visit pass details upon successful verification' })
  passDetails?: any;
}
