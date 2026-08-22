import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DocumentType } from '../enums/parent.enums';

export class UploadDocumentDto {
  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.AADHAAR_CARD,
    description: 'Type of identity / supporting document being uploaded',
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiPropertyOptional({
    example: 'XXXX-XXXX-1234',
    description: 'Document number (will be stored masked where applicable)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentNumber?: string;
}
