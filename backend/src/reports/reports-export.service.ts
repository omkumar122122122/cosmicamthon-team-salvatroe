import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from './reports.service';
import {
  ExportFormat,
  ExportReportType,
  ExportReportDto,
  ExportReportResponseDto,
  ReportHistoryDto,
  ReportHistoryItemDto,
} from './dto';
import { Role } from '../common/enums/role.enum';
import * as ExcelJS from 'exceljs';
import { parse } from 'json2csv';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportsExportService {
  private readonly logger = new Logger(ReportsExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
  ) {}

  /**
   * Export report in specified format
   */
  async exportReport(
    userId: string,
    userRole: Role,
    orphanageId: string | undefined,
    dto: ExportReportDto,
  ): Promise<ExportReportResponseDto> {
    this.logger.log(
      `Exporting report: ${dto.reportType} as ${dto.format} for user ${userId}`,
    );

    // Create export record
    const exportRecord = await this.prisma.reportExport.create({
      data: {
        reportType: this.mapExportTypeToSchema(dto.reportType) as any,
        format: dto.format,
        status: 'QUEUED',
        requestedById: userId,
        filters: dto.filters || {},
      },
    });

    // Generate report synchronously (for small reports)
    // In production, use a queue system for large reports
    try {
      await this.prisma.reportExport.update({
        where: { id: exportRecord.id },
        data: { status: 'GENERATING', startedAt: new Date() },
      });

      let fileBuffer: Buffer;
      let fileName: string;
      let mimeType: string;

      // Generate based on format
      switch (dto.format) {
        case ExportFormat.PDF:
          ({ fileBuffer, fileName, mimeType } = await this.generatePdf(
            userRole,
            orphanageId,
            dto.reportType,
          ));
          break;
        case ExportFormat.EXCEL:
          ({ fileBuffer, fileName, mimeType } = await this.generateExcel(
            userRole,
            orphanageId,
            dto.reportType,
          ));
          break;
        case ExportFormat.CSV:
          ({ fileBuffer, fileName, mimeType } = await this.generateCsv(
            userRole,
            orphanageId,
            dto.reportType,
          ));
          break;
        default:
          throw new Error(`Unsupported format: ${dto.format}`);
      }

      // Save file buffer to local disk storage
      const exportDir = path.join(process.cwd(), 'uploads', 'exports', exportRecord.id);
      fs.mkdirSync(exportDir, { recursive: true });
      const storagePath = path.join(exportDir, fileName);
      fs.writeFileSync(storagePath, fileBuffer);
      
      const downloadUrl = `/api/reports/${exportRecord.id}/download`;

      await this.prisma.reportExport.update({
        where: { id: exportRecord.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          fileName,
          storagePath,
          storageUrl: downloadUrl,
          fileSizeBytes: fileBuffer.length,
        },
      });

      return {
        exportId: exportRecord.id,
        status: 'COMPLETED',
        message: 'Report exported successfully',
        downloadUrl,
      };
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`, error.stack);

      await this.prisma.reportExport.update({
        where: { id: exportRecord.id },
        data: {
          status: 'FAILED',
          failureReason: error.message,
          retryCount: { increment: 1 },
        },
      });

      return {
        exportId: exportRecord.id,
        status: 'FAILED',
        message: `Export failed: ${error.message}`,
      };
    }
  }

  /**
   * Get export history for user
   */
  async getExportHistory(
    userId: string,
    userRole: Role,
  ): Promise<ReportHistoryDto> {
    this.logger.log(`Getting export history for user ${userId}`);

    const whereClause =
      userRole === Role.ADMIN
        ? {} // Admin sees all exports
        : { requestedById: userId }; // Others see only their exports

    const exports = await this.prisma.reportExport.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50, // Last 50 exports
      select: {
        id: true,
        reportType: true,
        format: true,
        status: true,
        fileName: true,
        fileSizeBytes: true,
        storageUrl: true,
        createdAt: true,
        completedAt: true,
      },
    });

    const total = await this.prisma.reportExport.count({ where: whereClause });

    const exportItems: ReportHistoryItemDto[] = exports.map(exp => ({
      id: exp.id,
      reportType: exp.reportType,
      format: exp.format,
      status: exp.status,
      fileName: exp.fileName || 'N/A',
      fileSizeBytes: exp.fileSizeBytes || 0,
      createdAt: exp.createdAt,
      completedAt: exp.completedAt || exp.createdAt,
      downloadUrl: exp.storageUrl || undefined,
    }));

    return {
      exports: exportItems,
      total,
    };
  }

  /**
   * Get download URL for completed export
   */
  async getDownloadUrl(
    exportId: string,
    userId: string,
    userRole: Role,
  ): Promise<string> {
    const exportRecord = await this.prisma.reportExport.findUnique({
      where: { id: exportId },
    });

    if (!exportRecord) {
      throw new NotFoundException(`Export ${exportId} not found`);
    }

    // Check permissions
    if (
      userRole !== Role.ADMIN &&
      exportRecord.requestedById !== userId
    ) {
      throw new NotFoundException(`Export ${exportId} not found`);
    }

    if (exportRecord.status !== 'COMPLETED') {
      throw new Error(`Export is not completed yet. Status: ${exportRecord.status}`);
    }

    return exportRecord.storageUrl || '';
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE GENERATION METHODS
  // ─────────────────────────────────────────────────────────

  private async generatePdf(
    userRole: Role,
    orphanageId: string | undefined,
    reportType: ExportReportType,
  ): Promise<{ fileBuffer: Buffer; fileName: string; mimeType: string }> {
    // For now, return a placeholder
    // In production, use pdfkit or puppeteer to generate PDF
    const data = await this.getReportData(userRole, orphanageId, reportType);
    
    const htmlContent = this.generateHtmlReport(data, reportType);
    const fileBuffer = Buffer.from(htmlContent, 'utf-8');
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${reportType.toLowerCase()}_report_${timestamp}.html`;

    return {
      fileBuffer,
      fileName,
      mimeType: 'text/html',
    };
  }

  private async generateExcel(
    userRole: Role,
    orphanageId: string | undefined,
    reportType: ExportReportType,
  ): Promise<{ fileBuffer: Buffer; fileName: string; mimeType: string }> {
    const data = await this.getReportData(userRole, orphanageId, reportType);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add headers and data based on report type
    if (reportType === ExportReportType.DASHBOARD) {
      worksheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 15 },
        { header: 'Trend', key: 'trend', width: 15 },
      ];

      const dashboardData = data as any;
      worksheet.addRows([
        { metric: 'AI Safety Score', value: dashboardData.aiSafetyScore?.value, trend: dashboardData.aiSafetyScore?.trend },
        { metric: 'Compliance Rate', value: dashboardData.complianceRate?.value, trend: dashboardData.complianceRate?.trend },
        { metric: 'High Risk Children', value: dashboardData.highRiskChildren?.value, trend: dashboardData.highRiskChildren?.trend },
        { metric: 'Avg Attendance', value: dashboardData.avgAttendance?.value, trend: dashboardData.avgAttendance?.trend },
      ]);
    }

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const fileBuffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${reportType.toLowerCase()}_report_${timestamp}.xlsx`;

    return {
      fileBuffer: Buffer.from(fileBuffer),
      fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private async generateCsv(
    userRole: Role,
    orphanageId: string | undefined,
    reportType: ExportReportType,
  ): Promise<{ fileBuffer: Buffer; fileName: string; mimeType: string }> {
    const data = await this.getReportData(userRole, orphanageId, reportType);

    let csvData: any[] = [];

    if (reportType === ExportReportType.DASHBOARD) {
      const dashboardData = data as any;
      csvData = [
        { metric: 'AI Safety Score', value: dashboardData.aiSafetyScore?.value, trend: dashboardData.aiSafetyScore?.trend },
        { metric: 'Compliance Rate', value: dashboardData.complianceRate?.value, trend: dashboardData.complianceRate?.trend },
        { metric: 'High Risk Children', value: dashboardData.highRiskChildren?.value, trend: dashboardData.highRiskChildren?.trend },
        { metric: 'Avg Attendance', value: dashboardData.avgAttendance?.value, trend: dashboardData.avgAttendance?.trend },
      ];
    }

    const csv = parse(csvData);
    const fileBuffer = Buffer.from(csv, 'utf-8');
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${reportType.toLowerCase()}_report_${timestamp}.csv`;

    return {
      fileBuffer,
      fileName,
      mimeType: 'text/csv',
    };
  }

  private async getReportData(
    userRole: Role,
    orphanageId: string | undefined,
    reportType: ExportReportType,
  ): Promise<any> {
    const userId = 'system'; // Placeholder for system-generated reports

    switch (reportType) {
      case ExportReportType.DASHBOARD:
        return await this.reportsService.getDashboardStats(userId, userRole, orphanageId);
      // Add more report types as needed
      default:
        return {};
    }
  }

  private generateHtmlReport(data: any, reportType: ExportReportType): string {
    const timestamp = new Date().toLocaleString();
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${reportType} Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #2563eb; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #2563eb; color: white; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>${reportType} Report</h1>
  <p>Generated: ${timestamp}</p>
  
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Trend</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>AI Safety Score</td>
        <td>${data.aiSafetyScore?.value || 'N/A'}</td>
        <td>${data.aiSafetyScore?.trend || 'N/A'}</td>
      </tr>
      <tr>
        <td>Compliance Rate</td>
        <td>${data.complianceRate?.value || 'N/A'}</td>
        <td>${data.complianceRate?.trend || 'N/A'}</td>
      </tr>
      <tr>
        <td>High Risk Children</td>
        <td>${data.highRiskChildren?.value || 'N/A'}</td>
        <td>${data.highRiskChildren?.trend || 'N/A'}</td>
      </tr>
      <tr>
        <td>Average Attendance</td>
        <td>${data.avgAttendance?.value || 'N/A'}</td>
        <td>${data.avgAttendance?.trend || 'N/A'}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <p>Orphan Age Child Safety System - Confidential Report</p>
  </div>
</body>
</html>
    `.trim();
  }

  private mapExportTypeToSchema(exportType: ExportReportType): string {
    const mapping = {
      [ExportReportType.DASHBOARD]: 'MONTHLY_COMPLIANCE',
      [ExportReportType.ATTENDANCE]: 'ATTENDANCE',
      [ExportReportType.HEALTH]: 'HEALTH_SUMMARY',
      [ExportReportType.AI_RISK]: 'RISK_ANALYSIS',
      [ExportReportType.ADOPTION]: 'ADOPTION_PIPELINE',
      [ExportReportType.VISIT_REQUESTS]: 'WELFARE_SESSION',
      [ExportReportType.WELFARE_SESSIONS]: 'WELFARE_SESSION',
      [ExportReportType.PARENT_VERIFICATION]: 'TRUST_SCORE_HISTORY',
      [ExportReportType.ORPHANAGE_COMPLIANCE]: 'MONTHLY_COMPLIANCE',
      [ExportReportType.SYSTEM_ANALYTICS]: 'MONTHLY_COMPLIANCE',
    };

    return mapping[exportType] || 'MONTHLY_COMPLIANCE';
  }
}
