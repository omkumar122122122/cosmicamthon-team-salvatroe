import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsObject } from 'class-validator';

export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
}

export enum ExportReportType {
  DASHBOARD = 'DASHBOARD',
  ATTENDANCE = 'ATTENDANCE',
  HEALTH = 'HEALTH',
  AI_RISK = 'AI_RISK',
  ADOPTION = 'ADOPTION',
  VISIT_REQUESTS = 'VISIT_REQUESTS',
  WELFARE_SESSIONS = 'WELFARE_SESSIONS',
  PARENT_VERIFICATION = 'PARENT_VERIFICATION',
  ORPHANAGE_COMPLIANCE = 'ORPHANAGE_COMPLIANCE',
  SYSTEM_ANALYTICS = 'SYSTEM_ANALYTICS',
}

export class ExportReportDto {
  @ApiProperty({ 
    enum: ExportFormat, 
    example: ExportFormat.PDF,
    description: 'Export format' 
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ 
    enum: ExportReportType, 
    example: ExportReportType.DASHBOARD,
    description: 'Report type to export' 
  })
  @IsEnum(ExportReportType)
  reportType: ExportReportType;

  @ApiProperty({ 
    required: false,
    example: { startDate: '2024-01-01', endDate: '2024-06-30' },
    description: 'Optional filters for the report'
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

export class ExportReportResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Export job ID' })
  exportId: string;

  @ApiProperty({ example: 'QUEUED', description: 'Export status' })
  status: string;

  @ApiProperty({ example: 'Report export queued successfully', description: 'Status message' })
  message: string;

  @ApiProperty({ 
    required: false,
    example: 'https://example.com/downloads/report.pdf',
    description: 'Download URL (if completed synchronously)' 
  })
  downloadUrl?: string;
}

export class ReportHistoryItemDto {
  @ApiProperty({ example: 'uuid-string', description: 'Export ID' })
  id: string;

  @ApiProperty({ example: 'DASHBOARD', description: 'Report type' })
  reportType: string;

  @ApiProperty({ example: 'PDF', description: 'Export format' })
  format: string;

  @ApiProperty({ example: 'COMPLETED', description: 'Export status' })
  status: string;

  @ApiProperty({ example: 'dashboard_report_2024-07-15.pdf', description: 'File name' })
  fileName: string;

  @ApiProperty({ example: 256000, description: 'File size in bytes' })
  fileSizeBytes: number;

  @ApiProperty({ example: '2024-07-15T10:30:00Z', description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-07-15T10:30:45Z', description: 'Completed timestamp' })
  completedAt: Date;

  @ApiProperty({ 
    required: false,
    example: 'https://example.com/downloads/report.pdf',
    description: 'Download URL' 
  })
  downloadUrl?: string;
}

export class ReportHistoryDto {
  @ApiProperty({ type: [ReportHistoryItemDto], description: 'List of report exports' })
  exports: ReportHistoryItemDto[];

  @ApiProperty({ example: 25, description: 'Total count of exports' })
  total: number;
}
