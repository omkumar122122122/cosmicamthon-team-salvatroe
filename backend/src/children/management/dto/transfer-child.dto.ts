import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RequestChildTransferDto {
  @ApiProperty({ example: 'target-orphanage-uuid-1234' })
  @IsString()
  @IsNotEmpty()
  targetOrphanageId: string;

  @ApiProperty({ example: 'Transfer to specialized medical care facility' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ example: 'CWC order #482 approval attached.' })
  @IsOptional()
  @IsString()
  transferNotes?: string;
}

export class ReviewTransferRequestDto {
  @ApiProperty({ example: 'transfer-uuid-1234' })
  @IsString()
  @IsNotEmpty()
  transferId: string;

  @ApiPropertyOptional({ example: 'Approved by CWC Admin' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddChildDocumentDto {
  @ApiProperty({ example: 'BIRTH_CERTIFICATE' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ example: 'Birth Certificate Copy' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'birth_cert_rahul.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 'https://storage.example.com/docs/birth_cert.pdf' })
  @IsString()
  @IsNotEmpty()
  storageUrl: string;
}
