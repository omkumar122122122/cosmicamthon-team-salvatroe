import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitKycDto {
  @ApiPropertyOptional({
    example: 'All required identity and income documents have been uploaded.',
    description: 'Optional notes submitted with the KYC package',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class RequestDocumentUpdateDto {
  @ApiPropertyOptional({
    example: 'Address changed, need to update address proof document.',
    description: 'Reason for requesting document update after KYC approval',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class RequestReuploadDto {
  @ApiPropertyOptional({
    example: 'Address proof document is illegible. Please upload a clear scan.',
    description: 'Reason for requesting document re-upload from parent',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional({
    example: ['ADDRESS_PROOF', 'INCOME_PROOF'],
    description: 'Specific document types requiring re-upload',
  })
  @IsOptional()
  documentTypes?: string[];
}
