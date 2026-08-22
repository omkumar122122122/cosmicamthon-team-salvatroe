import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';
import { DocumentStatus } from '../enums/parent.enums';

export class ReviewDocumentDto {
  @ApiProperty({
    enum: DocumentStatus,
    example: DocumentStatus.APPROVED,
    description: 'New status for the document',
  })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @ApiPropertyOptional({
    example: 'Document is blurry — please re-upload a clear scan',
    description: 'Required when status is REJECTED',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;

  @ApiPropertyOptional({
    example: 'Aadhaar number matches; address verified',
    description: 'Internal reviewer notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNotes?: string;

  @ApiPropertyOptional({ example: 'AADHAAR-1234-5678-9012', description: 'Document number (masked before storage)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentNumber?: string;

  @ApiPropertyOptional({ example: 'UIDAI' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  issuedBy?: string;

  @ApiPropertyOptional({ example: '2015-08-10' })
  @IsOptional()
  @IsDateString()
  issuedDate?: string;

  @ApiPropertyOptional({ example: '2035-08-10' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
