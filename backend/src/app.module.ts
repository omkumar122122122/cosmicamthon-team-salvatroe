import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { ChildrenModule } from './children/children.module';
import { ParentsModule } from './parents/parents.module';
import { StaffModule } from './staff/staff.module';
import { OrphanagesModule } from './orphanages/orphanages.module';
import { VisitRequestsModule } from './visit-requests/visit-requests.module';
import { AdoptionsModule } from './adoptions/adoptions.module';
import { PostAdoptionMonitoringModule } from './post-adoption-monitoring/post-adoption-monitoring.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { DonorsModule } from './donors/donors.module';
import { DonationRequestsModule } from './donation-requests/donation-requests.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

import { AdminModule } from './admin/admin.module';
import { NfcModule } from './nfc/nfc.module';

import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import emailConfig from './config/email.config';

@Module({
  imports: [
    // Configuration — load env vars globally
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, emailConfig],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Schedule module for daily cron automation
    ScheduleModule.forRoot(),

    // Rate limiting — global throttle guard
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'short',
          ttl: config.get<number>('THROTTLE_SHORT_TTL', 1000),
          limit: config.get<number>('THROTTLE_SHORT_LIMIT', 3),
        },
        {
          name: 'medium',
          ttl: config.get<number>('THROTTLE_MEDIUM_TTL', 10000),
          limit: config.get<number>('THROTTLE_MEDIUM_LIMIT', 20),
        },
        {
          name: 'long',
          ttl: config.get<number>('THROTTLE_LONG_TTL', 60000),
          limit: config.get<number>('THROTTLE_LONG_LIMIT', 100),
        },
      ],
    }),

    PrismaModule,
    CommonModule,
    AuthModule,
    AdminModule,
    UsersModule,
    ChildrenModule,
    ParentsModule,
    StaffModule,
    OrphanagesModule,
    VisitRequestsModule,
    AdoptionsModule,
    PostAdoptionMonitoringModule,
    AlertsModule,
    NotificationsModule,
    ChatModule,
    DashboardModule,
    ReportsModule,
    SettingsModule,
    DonorsModule,
    DonationRequestsModule,
    NfcModule,
  ],
  providers: [
    // Apply throttle guard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, SecurityHeadersMiddleware)
      .forRoutes('*');
  }
}
