import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Role, RiskLevel } from '@prisma/client';
import { PostAdoptionMonitoringService } from './post-adoption-monitoring.service';
import { PostAdoptionMonitoringRepository } from './post-adoption-monitoring.repository';
import { AlertsGenerationService } from '../alerts/alerts-generation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { FaceAnalysisService } from './ai/face-analysis.service';
import { VoiceAnalysisService } from './ai/voice-analysis.service';
import { SpeechService } from './ai/speech.service';
import { AnswerAnalysisService } from './ai/answer-analysis.service';
import { AIAnalysisService } from './ai/ai-analysis.service';

describe('PostAdoptionMonitoringService', () => {
  let service: PostAdoptionMonitoringService;
  let repository: any;
  let faceAnalysisService: any;
  let voiceAnalysisService: any;
  let speechService: any;
  let answerAnalysisService: any;
  let aiAnalysisService: any;

  beforeEach(async () => {
    const mockRepo = {
      findSchedules: jest.fn().mockResolvedValue({ schedules: [], total: 0 }),
      findScheduleById: jest.fn(),
      findScheduleByChildAndAdoption: jest.fn(),
      createSchedule: jest.fn(),
      updateSchedule: jest.fn(),
      findAssessmentById: jest.fn(),
      createAssessment: jest.fn(),
      updateAssessment: jest.fn(),
      submitAssessmentTransaction: jest.fn(),
      findQuestionsByAge: jest.fn().mockResolvedValue([]),
      findQuestionsByIds: jest.fn().mockResolvedValue([]),
      findChildById: jest.fn(),
      findParentByUserId: jest.fn(),
      findAdoptionByChildId: jest.fn(),
      findPreviousAssessmentsByChildId: jest.fn().mockResolvedValue([]),
    };

    const mockAlerts = { triggerAlert: jest.fn() };
    const mockNotifications = { create: jest.fn() };
    const mockPrisma = { user: { findMany: jest.fn().mockResolvedValue([]) } };

    const mockFace = {
      analyzeFace: jest.fn().mockResolvedValue({
        faceScore: 90,
        dominantEmotion: 'happy',
        emotions: { happy: 80, neutral: 15, sad: 2, fear: 2, angry: 1 },
        welfareSign: 'Positive',
      }),
    };

    const mockVoice = {
      analyzeVoice: jest.fn().mockResolvedValue({
        voiceScore: 85,
        emotions: { stress: 10, fear: 5, calm: 85, confidence: 85 },
        vocalHealth: 'Stable',
      }),
    };

    const mockSpeech = { transcribeAudio: jest.fn().mockResolvedValue('Child feels safe') };
    const mockAnswer = {
      analyzeAnswer: jest.fn().mockResolvedValue({
        sentiment: 'POSITIVE',
        confidence: 0.95,
        stress: 0.05,
        summary: 'Positive answer',
      }),
    };

    const mockAi = {
      evaluateAssessment: jest.fn().mockResolvedValue({
        faceResult: { faceScore: 90, emotions: {} },
        voiceResult: { voiceScore: 85, emotions: {} },
        answersResult: [],
        overallScore: 88,
        overallRisk: RiskLevel.LOW,
        summary: 'Healthy evaluation',
        recommendation: 'Continue assessments',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostAdoptionMonitoringService,
        { provide: PostAdoptionMonitoringRepository, useValue: mockRepo },
        { provide: AlertsGenerationService, useValue: mockAlerts },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FaceAnalysisService, useValue: mockFace },
        { provide: VoiceAnalysisService, useValue: mockVoice },
        { provide: SpeechService, useValue: mockSpeech },
        { provide: AnswerAnalysisService, useValue: mockAnswer },
        { provide: AIAnalysisService, useValue: mockAi },
      ],
    }).compile();

    service = module.get<PostAdoptionMonitoringService>(PostAdoptionMonitoringService);
    repository = module.get(PostAdoptionMonitoringRepository);
    faceAnalysisService = module.get(FaceAnalysisService);
    voiceAnalysisService = module.get(VoiceAnalysisService);
    speechService = module.get(SpeechService);
    answerAnalysisService = module.get(AnswerAnalysisService);
    aiAnalysisService = module.get(AIAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSchedule', () => {
    it('should return schedules and meta', async () => {
      const result = await service.getSchedule('user-1', Role.ADMIN, {});
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(repository.findSchedules).toHaveBeenCalled();
    });
  });

  describe('uploadFace', () => {
    it('should throw NotFoundException if assessment not found', async () => {
      repository.findAssessmentById.mockResolvedValue(null);
      await expect(service.uploadFace({ assessmentId: 'invalid-id' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate face emotion score on valid assessment', async () => {
      repository.findAssessmentById.mockResolvedValue({ id: 'ass-1' });
      const res = await service.uploadFace({ assessmentId: 'ass-1' });
      expect(res).toHaveProperty('faceScore', 90);
      expect(faceAnalysisService.analyzeFace).toHaveBeenCalled();
    });
  });

  describe('uploadVoice', () => {
    it('should calculate voice emotion score and transcription', async () => {
      repository.findAssessmentById.mockResolvedValue({ id: 'ass-1' });
      const res = await service.uploadVoice({ assessmentId: 'ass-1' });
      expect(res).toHaveProperty('voiceScore', 85);
      expect(res).toHaveProperty('transcription', 'Child feels safe');
      expect(voiceAnalysisService.analyzeVoice).toHaveBeenCalled();
    });
  });

  describe('validateParentChildAuthorization', () => {
    it('should throw ForbiddenException if parent record does not match adoption', async () => {
      repository.findParentByUserId.mockResolvedValue({ id: 'p-1' });
      repository.findAdoptionByChildId.mockResolvedValue({ id: 'ad-1', adoptiveParentId: 'other-parent' });

      await expect(
        service.validateParentChildAuthorization('user-1', Role.PARENT, 'child-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should pass if parent is authorized adoptive parent', async () => {
      repository.findParentByUserId.mockResolvedValue({ id: 'p-1' });
      repository.findAdoptionByChildId.mockResolvedValue({ id: 'ad-1', adoptiveParentId: 'p-1' });

      await expect(
        service.validateParentChildAuthorization('user-1', Role.PARENT, 'child-1'),
      ).resolves.not.toThrow();
    });
  });
});
