import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class VerifyNfcDto {
  @ApiPropertyOptional({ description: 'Raw QR scan content, full URL, token, or NFC ID' })
  @IsString()
  @IsOptional()
  credential?: string;

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
  @ApiProperty({ description: 'Verification outcome status (SUCCESS, EXPIRED, INVALID, NOT_APPROVED, REJECTED, CANCELLED, WRONG_DATE, TOO_EARLY, COMPLETED)' })
  status: 'SUCCESS' | 'EXPIRED' | 'INVALID' | 'NOT_APPROVED' | 'REJECTED' | 'CANCELLED' | 'WRONG_DATE' | 'TOO_EARLY' | 'COMPLETED';

  @ApiPropertyOptional({ description: 'Access decision (GRANTED or DENIED)' })
  access?: 'GRANTED' | 'DENIED';

  @ApiPropertyOptional({ description: 'Gate movement direction (ENTRY or EXIT)' })
  movement?: 'ENTRY' | 'EXIT';

  @ApiPropertyOptional({ description: 'Whether this scan was detected as duplicate in cooldown period' })
  duplicate?: boolean;

  @ApiProperty({ description: 'Human-readable verification message' })
  message: string;

  @ApiProperty({ description: 'Verification timestamp' })
  verifiedAt: Date;

  @ApiPropertyOptional({ description: 'Parent details' })
  parent?: { id: string; name: string };

  @ApiPropertyOptional({ description: 'Child details' })
  child?: { name: string; code?: string };

  @ApiPropertyOptional({ description: 'Orphanage details' })
  orphanage?: { id: string; name: string; city?: string };

  @ApiPropertyOptional({ description: 'Visit details' })
  visit?: { id: string; requestId?: string; visitDate: any; visitTime: string; status: string; checkInTime?: any; checkOutTime?: any };

  @ApiPropertyOptional({ description: 'Human Pass ID' })
  passId?: string;

  @ApiPropertyOptional({ description: 'Updated visit pass details upon successful verification' })
  passDetails?: any;
}

