import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NfcParentSummaryDto {
  @ApiProperty({ description: 'Parent ID' })
  id: string;

  @ApiProperty({ description: 'Parent Full Name' })
  name: string;

  @ApiPropertyOptional({ description: 'Primary Address' })
  address?: string;

  @ApiPropertyOptional({ description: 'Phone Number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Email Address' })
  email?: string;
}

export class NfcOrphanageSummaryDto {
  @ApiProperty({ description: 'Orphanage ID' })
  id: string;

  @ApiProperty({ description: 'Orphanage Name' })
  name: string;

  @ApiPropertyOptional({ description: 'City' })
  city?: string;

  @ApiPropertyOptional({ description: 'State' })
  state?: string;

  @ApiPropertyOptional({ description: 'Phone' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Address' })
  address?: string;
}

export class NfcChildSummaryDto {
  @ApiProperty({ description: 'Child ID' })
  id: string;

  @ApiProperty({ description: 'Child Full Name' })
  name: string;

  @ApiPropertyOptional({ description: 'Child Code' })
  code?: string;

  @ApiPropertyOptional({ description: 'Age' })
  age?: number;

  @ApiPropertyOptional({ description: 'Gender' })
  gender?: string;
}

export class NfcVisitResponseDto {
  @ApiProperty({ description: 'Human-readable unique NFC ID (e.g., NFC-VST-8F3K92)' })
  nfcId: string;

  @ApiProperty({ description: 'Secure Token used for NFC URL / cryptographic check' })
  secureToken: string;

  @ApiProperty({ description: 'Full NFC visit tap URL' })
  nfcUrl: string;

  @ApiPropertyOptional({ description: 'QR Code image URL for physical scanning' })
  qrCode?: string;

  @ApiProperty({ description: 'Internal visit request ID' })
  visitRequestId: string;

  @ApiProperty({ description: 'Visit request human tracking code (e.g. VR-260801)' })
  requestId: string;

  @ApiProperty({ description: 'Visit Request Status' })
  visitStatus: string;

  @ApiProperty({ description: 'Scheduled Visit Date' })
  visitDate: Date;

  @ApiProperty({ description: 'Scheduled Visit Time Slot' })
  visitTime: string;

  @ApiPropertyOptional({ description: 'Designated Meeting Room' })
  meetingRoom?: string;

  @ApiPropertyOptional({ description: 'Assigned Staff Supervisor' })
  assignedStaff?: string;

  @ApiProperty({ description: 'Parent details' })
  parent: NfcParentSummaryDto;

  @ApiProperty({ description: 'Orphanage details' })
  orphanage: NfcOrphanageSummaryDto;

  @ApiPropertyOptional({ description: 'Child details if assigned' })
  child?: NfcChildSummaryDto;

  @ApiProperty({ description: 'Whether the NFC visit pass is currently valid and active' })
  isValid: boolean;

  @ApiProperty({ description: 'Number of times this NFC pass has been scanned/verified' })
  scanCount: number;

  @ApiPropertyOptional({ description: 'Last scanned timestamp' })
  lastScannedAt?: Date;

  @ApiPropertyOptional({ description: 'Recent verification scans history' })
  scans?: NfcScanItemDto[];

  @ApiProperty({ description: 'Pass creation date' })
  createdAt: Date;
}

export class NfcScanItemDto {
  @ApiProperty({ description: 'Scan record ID' })
  id: string;

  @ApiProperty({ description: 'Timestamp when scan occurred' })
  scannedAt: Date;

  @ApiPropertyOptional({ description: 'Staff user or scanner identity' })
  scannedBy?: string;

  @ApiProperty({ description: 'Scan verification outcome (SUCCESS, EXPIRED, INVALID)' })
  result: string;

  @ApiPropertyOptional({ description: 'Optional scan notes' })
  notes?: string;
}
