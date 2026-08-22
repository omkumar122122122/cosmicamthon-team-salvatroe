import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all system settings grouped by section
   */
  async getAllSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    
    return {
      general: this.parseSettings(settings, 'general'),
      authentication: this.parseSettings(settings, 'authentication'),
      registration: this.parseSettings(settings, 'registration'),
      childSafety: this.parseSettings(settings, 'childSafety'),
      notifications: this.parseSettings(settings, 'notifications'),
      alerts: this.parseSettings(settings, 'alerts'),
      ai: this.parseSettings(settings, 'ai'),
      reports: this.parseSettings(settings, 'reports'),
      backup: this.parseSettings(settings, 'backup'),
      audit: this.parseSettings(settings, 'audit'),
      security: this.parseSettings(settings, 'security'),
    };
  }

  /**
   * Get settings for a specific section
   */
  async getSection(section: string) {
    const settings = await this.prisma.systemSetting.findMany({
      where: { group: section },
    });
    
    return this.parseSettings(settings, section);
  }

  /**
   * Update general settings
   */
  async updateGeneral(data: GeneralSettingsDto, userId: string) {
    return this.updateSettings('general', data, userId);
  }

  /**
   * Update authentication settings
   */
  async updateAuthentication(data: AuthenticationSettingsDto, userId: string) {
    return this.updateSettings('authentication', data, userId);
  }

  /**
   * Update registration settings
   */
  async updateRegistration(data: RegistrationSettingsDto, userId: string) {
    return this.updateSettings('registration', data, userId);
  }

  /**
   * Update child safety settings
   */
  async updateChildSafety(data: ChildSafetySettingsDto, userId: string) {
    return this.updateSettings('childSafety', data, userId);
  }

  /**
   * Update notification settings
   */
  async updateNotifications(data: NotificationSettingsDto, userId: string) {
    return this.updateSettings('notifications', data, userId);
  }

  /**
   * Update alert settings
   */
  async updateAlerts(data: AlertSettingsDto, userId: string) {
    return this.updateSettings('alerts', data, userId);
  }

  /**
   * Update AI settings
   */
  async updateAI(data: AISettingsDto, userId: string) {
    return this.updateSettings('ai', data, userId);
  }

  /**
   * Update report settings
   */
  async updateReports(data: ReportSettingsDto, userId: string) {
    return this.updateSettings('reports', data, userId);
  }

  /**
   * Update backup settings
   */
  async updateBackup(data: BackupSettingsDto, userId: string) {
    return this.updateSettings('backup', data, userId);
  }

  /**
   * Update audit settings
   */
  async updateAudit(data: AuditSettingsDto, userId: string) {
    return this.updateSettings('audit', data, userId);
  }

  /**
   * Update security settings
   */
  async updateSecurity(data: SecuritySettingsDto, userId: string) {
    return this.updateSettings('security', data, userId);
  }

  /**
   * Create a manual backup
   */
  async createBackup(userId: string) {
    // Implementation for creating database backup
    // This would typically use pg_dump or similar utility
    throw new BadRequestException('Backup functionality not yet implemented');
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: string, userId: string) {
    // Implementation for restoring from backup
    throw new BadRequestException('Restore functionality not yet implemented');
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults(userId: string) {
    const defaults = this.getDefaultSettings();
    
    for (const [group, settings] of Object.entries(defaults)) {
      await this.updateSettings(group, settings, userId);
    }
    
    return { message: 'Settings reset to defaults successfully' };
  }

  /**
   * Helper: Parse settings from database format
   */
  private parseSettings(settings: any[], group: string) {
    const result: any = {};
    
    settings
      .filter(s => s.group === group)
      .forEach(setting => {
        const key = setting.key.replace(`${group}.`, '');
        
        // Handle nested keys (e.g., passwordPolicy.minLength)
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          if (!result[parent]) result[parent] = {};
          result[parent][child] = this.parseValue(setting.value, setting.dataType);
        } else {
          result[key] = this.parseValue(setting.value, setting.dataType);
        }
      });
    
    return result;
  }

  /**
   * Helper: Parse value based on data type
   */
  private parseValue(value: string, dataType: string): any {
    switch (dataType) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseFloat(value);
      case 'json':
        return JSON.parse(value);
      default:
        return value;
    }
  }

  /**
   * Helper: Update settings in database
   */
  private async updateSettings(group: string, data: any, userId: string) {
    const flatData = this.flattenObject(data, group);
    
    for (const [key, value] of Object.entries(flatData)) {
      const dataType = this.getDataType(value);
      const stringValue = this.stringifyValue(value, dataType);
      
      await this.prisma.systemSetting.upsert({
        where: { key },
        create: {
          key,
          value: stringValue,
          dataType,
          group,
          updatedById: userId,
        },
        update: {
          value: stringValue,
          dataType,
          updatedById: userId,
        },
      });
    }
    
    return this.getSection(group);
  }

  /**
   * Helper: Flatten nested object to dot notation
   */
  private flattenObject(obj: any, prefix: string = ''): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;
      
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, fullKey));
      } else {
        result[fullKey] = value;
      }
    }
    
    return result;
  }

  /**
   * Helper: Get data type of value
   */
  private getDataType(value: any): string {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) return 'json';
    return 'string';
  }

  /**
   * Helper: Stringify value for database storage
   */
  private stringifyValue(value: any, dataType: string): string {
    if (dataType === 'json') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Helper: Get default settings
   */
  private getDefaultSettings() {
    return {
      general: {
        systemName: 'Orphan Age Child Safety System',
        organizationName: 'Child Welfare Organization',
        contactEmail: 'admin@example.com',
        contactNumber: '',
        address: '',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        language: 'en',
      },
      authentication: {
        jwtExpiry: 60,
        refreshTokenExpiry: 7,
        maxLoginAttempts: 5,
        accountLockDuration: 30,
        sessionTimeout: 30,
        otpExpiry: 5,
        twoFactorEnabled: false,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumber: true,
          requireSpecialChar: true,
        },
      },
      registration: {
        allowParentRegistration: true,
        allowOrphanageRegistration: true,
        requireEmailVerification: true,
        requireAdminApproval: false,
        defaultUserStatus: 'PENDING',
      },
      childSafety: {
        aiRiskThreshold: 70,
        highRiskScore: 80,
        mediumRiskScore: 50,
        welfareSessionFrequency: 30,
        adoptionFollowUpInterval: 90,
        emergencyAlertThreshold: 90,
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        inAppNotifications: true,
        events: {
          newChildRegistration: true,
          adoptionRequest: true,
          adoptionApproved: true,
          highRiskAlert: true,
          missedWelfareSession: true,
          documentExpiring: true,
          verificationPending: true,
          emergencyCase: true,
        },
      },
      alerts: {
        highRiskChild: true,
        missedWelfareSession: true,
        failedAISession: true,
        rejectedVerification: true,
        missedAttendance: true,
        emergencyCase: true,
        expiredDocuments: true,
      },
      ai: {
        enableAI: true,
        defaultAIModel: 'gemini-1.5-flash',
        riskAnalysis: true,
        faceRecognition: true,
        conversationAnalysis: true,
        autoRiskDetection: true,
        autoRecommendations: true,
      },
      reports: {
        defaultFormat: 'PDF',
        reportRetention: 365,
        autoMonthlyReports: true,
        autoWeeklyReports: false,
      },
      backup: {
        schedule: 'DAILY',
        retentionDays: 30,
      },
      audit: {
        auditLogging: true,
        loginLogs: true,
        actionLogs: true,
        retentionPeriod: 365,
      },
      security: {
        helmet: true,
        rateLimiter: true,
        cors: true,
        allowedOrigins: ['http://localhost:5173', 'http://localhost:3000'],
        allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        maxUploadSize: 10,
      },
    };
  }
}
