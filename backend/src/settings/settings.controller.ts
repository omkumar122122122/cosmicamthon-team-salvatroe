import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import {
  GeneralSettingsDto,
  AuthenticationSettingsDto,
  RegistrationSettingsDto,
  ChildSafetySettingsDto,
  NotificationSettingsDto,
  AlertSettingsDto,
  AISettingsDto,
  ReportSettingsDto,
  BackupSettingsDto,
  AuditSettingsDto,
  SecuritySettingsDto,
} from './dto';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get(':section')
  @ApiOperation({ summary: 'Get settings for a specific section' })
  @ApiResponse({ status: 200, description: 'Section settings retrieved successfully' })
  async getSection(@Param('section') section: string) {
    const validSections = [
      'general',
      'authentication',
      'registration',
      'childSafety',
      'notifications',
      'alerts',
      'ai',
      'reports',
      'backup',
      'audit',
      'security',
    ];

    if (!validSections.includes(section)) {
      throw new BadRequestException(`Invalid section: ${section}`);
    }

    return this.settingsService.getSection(section);
  }

  @Patch('general')
  @ApiOperation({ summary: 'Update general settings' })
  @ApiResponse({ status: 200, description: 'General settings updated successfully' })
  async updateGeneral(
    @Body() data: GeneralSettingsDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateGeneral(data, req.user.id);
  }

  @Patch('authentication')
  @ApiOperation({ summary: 'Update authentication settings' })
  @ApiResponse({ status: 200, description: 'Authentication settings updated successfully' })
  async updateAuthentication(
    @Body() data: AuthenticationSettingsDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateAuthentication(data, req.user.id);
  }

  @Patch('registration')
  @ApiOperation({ summary: 'Update registration settings' })
  @ApiResponse({ status: 200, description: 'Registration settings updated successfully' })
  async updateRegistration(
    @Body() data: RegistrationSettingsDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateRegistration(data, req.user.id);
  }

  @Patch('childSafety')
  @ApiOperation({ summary: 'Update child safety settings' })
  @ApiResponse({ status: 200, description: 'Child safety settings updated successfully' })
  async updateChildSafety(
    @Body() data: ChildSafetySettingsDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateChildSafety(data, req.user.id);
  }

  @Patch('notifications')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings updated successfully' })
  async updateNotifications(
    @Body() data: NotificationSettingsDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateNotifications(data, req.user.id);
  }

  @Patch('alerts')
  @ApiOperation({ summary: 'Update alert settings' })
  @ApiResponse({ status: 200, description: 'Alert settings updated successfully' })
  async updateAlerts(
    @Body() data: AlertSettingsDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateAlerts(data, req.user.id);
  }

  @Patch('ai')
  @ApiOperation({ summary: 'Update AI settings' })
  @ApiResponse({ status: 200, description: 'AI settings updated successfully' })
  async updateAI(
    @Body() data: AISettingsDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateAI(data, req.user.id);
  }

  @Patch('reports')
  @ApiOperation({ summary: 'Update report settings' })
  @ApiResponse({ status: 200, description: 'Report settings updated successfully' })
  async updateReports(
    @Body() data: ReportSettingsDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateReports(data, req.user.id);
  }

  @Patch('backup')
  @ApiOperation({ summary: 'Update backup settings' })
  @ApiResponse({ status: 200, description: 'Backup settings updated successfully' })
  async updateBackup(
    @Body() data: BackupSettingsDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateBackup(data, req.user.id);
  }

  @Patch('audit')
  @ApiOperation({ summary: 'Update audit settings' })
  @ApiResponse({ status: 200, description: 'Audit settings updated successfully' })
  async updateAudit(
    @Body() data: AuditSettingsDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateAudit(data, req.user.id);
  }

  @Patch('security')
  @ApiOperation({ summary: 'Update security settings' })
  @ApiResponse({ status: 200, description: 'Security settings updated successfully' })
  async updateSecurity(
    @Body() data: SecuritySettingsDto,
    @Request() req: any,
  ) {
    return this.settingsService.updateSecurity(data, req.user.id);
  }

  @Post('backup')
  @ApiOperation({ summary: 'Create manual database backup' })
  @ApiResponse({ status: 200, description: 'Backup created successfully' })
  async createBackup(@Request() req: any) {
    return this.settingsService.createBackup(req.user.id);
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restore from backup' })
  @ApiResponse({ status: 200, description: 'Backup restored successfully' })
  async restoreBackup(
    @Body('backupId') backupId: string,
    @Request() req: any,
  ) {
    return this.settingsService.restoreBackup(backupId, req.user.id);
  }

  @Post('reset-default')
  @ApiOperation({ summary: 'Reset all settings to defaults' })
  @ApiResponse({ status: 200, description: 'Settings reset to defaults successfully' })
  async resetToDefaults(@Request() req: any) {
    return this.settingsService.resetToDefaults(req.user.id);
  }
}
