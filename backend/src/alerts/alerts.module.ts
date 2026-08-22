import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsGenerationService } from './alerts-generation.service';

/**
 * AlertsModule
 *
 * Provides:
 *  - AlertsController  → REST API endpoints for the frontend
 *  - AlertsService     → Query / resolve logic with role scoping
 *  - AlertsGenerationService → Auto-generate alerts from other modules
 *
 * AlertsGenerationService is EXPORTED so other modules (Adoptions,
 * Children, Orphanages, etc.) can inject it and fire alerts without
 * circular dependencies.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsGenerationService],
  exports: [AlertsGenerationService],
})
export class AlertsModule {}
