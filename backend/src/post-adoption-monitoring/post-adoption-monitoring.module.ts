import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertsModule } from '../alerts/alerts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PostAdoptionMonitoringController } from './post-adoption-monitoring.controller';
import { PostAdoptionMonitoringService } from './post-adoption-monitoring.service';
import { PostAdoptionMonitoringRepository } from './post-adoption-monitoring.repository';
import { PostAdoptionSchedulerService } from './post-adoption-scheduler.service';

// AI Services
import { FaceAnalysisService } from './ai/face-analysis.service';
import { VoiceAnalysisService } from './ai/voice-analysis.service';
import { SpeechService } from './ai/speech.service';
import { AnswerAnalysisService } from './ai/answer-analysis.service';
import { AIAnalysisService } from './ai/ai-analysis.service';
import { RiskEngineService } from './ai/risk-engine.service';

@Module({
  imports: [PrismaModule, AlertsModule, NotificationsModule],
  controllers: [PostAdoptionMonitoringController],
  providers: [
    PostAdoptionMonitoringService,
    PostAdoptionMonitoringRepository,
    PostAdoptionSchedulerService,
    FaceAnalysisService,
    VoiceAnalysisService,
    SpeechService,
    AnswerAnalysisService,
    AIAnalysisService,
    RiskEngineService,
  ],
  exports: [
    PostAdoptionMonitoringService,
    PostAdoptionMonitoringRepository,
    PostAdoptionSchedulerService,
    FaceAnalysisService,
    VoiceAnalysisService,
    SpeechService,
    AnswerAnalysisService,
    AIAnalysisService,
    RiskEngineService,
  ],
})
export class PostAdoptionMonitoringModule {}
