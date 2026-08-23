import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VisitRequestsController } from './visit-requests.controller';
import { VisitRequestsService } from './visit-requests.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuthModule, ConfigModule],
  controllers: [VisitRequestsController],
  providers: [VisitRequestsService],
  exports: [VisitRequestsService],
})
export class VisitRequestsModule {}
