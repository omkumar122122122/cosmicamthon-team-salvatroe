import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportsExportService } from './reports-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import {
  DashboardStatsDto,
  MonthlyTrendDto,
  RiskDistributionDto,
  ComplianceSummaryDto,
  ActivityBreakdownDto,
  ExportReportDto,
  ExportReportResponseDto,
  ReportHistoryDto,
} from './dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsExportService: ReportsExportService,
  ) {}

  @Get('dashboard-stats')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ 
    summary: 'Get Dashboard Statistics',
    description: 'Retrieve KPI metrics with trends for dashboard display. ORPHANAGE users see only their orphanage data, ADMIN sees all data.'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN or ORPHANAGE role required' })
  async getDashboardStats(@Request() req: any): Promise<DashboardStatsDto> {
    const { userId, role, orphanageId } = this.extractUserInfo(req);
    return this.reportsService.getDashboardStats(userId, role, orphanageId);
  }

  @Get('monthly-trend')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ 
    summary: 'Get Monthly Trend Data',
    description: 'Retrieve 6-month historical trend data for safety scores and compliance rates.'
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly trend data retrieved successfully',
    type: MonthlyTrendDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN or ORPHANAGE role required' })
  async getMonthlyTrend(@Request() req: any): Promise<MonthlyTrendDto> {
    const { userId, role, orphanageId } = this.extractUserInfo(req);
    return this.reportsService.getMonthlyTrend(userId, role, orphanageId);
  }

  @Get('risk-distribution')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ 
    summary: 'Get Risk Distribution',
    description: 'Retrieve risk level distribution across children for doughnut chart display.'
  })
  @ApiResponse({
    status: 200,
    description: 'Risk distribution retrieved successfully',
    type: RiskDistributionDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN or ORPHANAGE role required' })
  async getRiskDistribution(@Request() req: any): Promise<RiskDistributionDto> {
    const { userId, role, orphanageId } = this.extractUserInfo(req);
    return this.reportsService.getRiskDistribution(userId, role, orphanageId);
  }

  @Get('compliance-summary')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ 
    summary: 'Get Compliance Summary',
    description: 'Retrieve compliance metrics including submitted forms, pending reviews, and inspection scores.'
  })
  @ApiResponse({
    status: 200,
    description: 'Compliance summary retrieved successfully',
    type: ComplianceSummaryDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN or ORPHANAGE role required' })
  async getComplianceSummary(@Request() req: any): Promise<ComplianceSummaryDto> {
    const { userId, role, orphanageId } = this.extractUserInfo(req);
    return this.reportsService.getComplianceSummary(userId, role, orphanageId);
  }

  @Get('activity-breakdown')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ 
    summary: 'Get Activity Breakdown',
    description: 'Retrieve activity metrics including visits, health checks, education updates, and safety inspections.'
  })
  @ApiResponse({
    status: 200,
    description: 'Activity breakdown retrieved successfully',
    type: ActivityBreakdownDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN or ORPHANAGE role required' })
  async getActivityBreakdown(@Request() req: any): Promise<ActivityBreakdownDto> {
    const { userId, role, orphanageId } = this.extractUserInfo(req);
    return this.reportsService.getActivityBreakdown(userId, role, orphanageId);
  }

  @Post('export')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Export Report',
    description: 'Generate and export report in specified format (PDF, Excel, CSV). Returns export job ID and download URL.'
  })
  @ApiResponse({
    status: 200,
    description: 'Report export initiated successfully',
    type: ExportReportResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid export request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN or ORPHANAGE role required' })
  async exportReport(
    @Request() req: any,
    @Body() dto: ExportReportDto,
  ): Promise<ExportReportResponseDto> {
    const { userId, role, orphanageId } = this.extractUserInfo(req);
    return this.reportsExportService.exportReport(userId, role, orphanageId, dto);
  }

  @Get('history')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ 
    summary: 'Get Export History',
    description: 'Retrieve list of previously generated report exports. ORPHANAGE users see only their exports, ADMIN sees all.'
  })
  @ApiResponse({
    status: 200,
    description: 'Export history retrieved successfully',
    type: ReportHistoryDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN or ORPHANAGE role required' })
  async getExportHistory(@Request() req: any): Promise<ReportHistoryDto> {
    const { userId, role } = this.extractUserInfo(req);
    return this.reportsExportService.getExportHistory(userId, role);
  }

  @Get(':id/download')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ 
    summary: 'Get Download URL',
    description: 'Retrieve download URL for a completed report export.'
  })
  @ApiParam({ name: 'id', description: 'Export ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Download URL retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string', example: 'https://example.com/downloads/report.pdf' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Export not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN or ORPHANAGE role required' })
  async getDownloadUrl(
    @Request() req: any,
    @Param('id') exportId: string,
  ): Promise<{ downloadUrl: string }> {
    const { userId, role } = this.extractUserInfo(req);
    const downloadUrl = await this.reportsExportService.getDownloadUrl(
      exportId,
      userId,
      role,
    );
    return { downloadUrl };
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE HELPER METHODS
  // ─────────────────────────────────────────────────────────

  private extractUserInfo(req: any): {
    userId: string;
    role: Role;
    orphanageId?: string;
  } {
    const user = req.user;
    
    // Extract orphanageId for ORPHANAGE role users
    let orphanageId: string | undefined;
    if (user.role === Role.ORPHANAGE) {
      orphanageId = user.orphanageId || user.orphanage?.id;
    }

    return {
      userId: user.id || user.sub,
      role: user.role,
      orphanageId,
    };
  }
}
