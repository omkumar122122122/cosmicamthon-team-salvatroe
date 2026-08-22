import { Test, TestingModule } from '@nestjs/testing';
import { PostAdoptionMonitoringController } from './post-adoption-monitoring.controller';
import { PostAdoptionMonitoringService } from './post-adoption-monitoring.service';
import { Role } from '../common/enums/role.enum';

describe('PostAdoptionMonitoringController', () => {
  let controller: PostAdoptionMonitoringController;
  let service: any;

  beforeEach(async () => {
    const mockService = {
      getSchedule: jest.fn().mockResolvedValue({ data: [], meta: {} }),
      startAssessment: jest.fn().mockResolvedValue({ assessmentId: 'ass-1' }),
      getQuestions: jest.fn().mockResolvedValue({ questions: [] }),
      uploadFace: jest.fn().mockResolvedValue({ faceScore: 90 }),
      uploadVoice: jest.fn().mockResolvedValue({ voiceScore: 85 }),
      submitAssessment: jest.fn().mockResolvedValue({ assessmentId: 'ass-1' }),
      getReport: jest.fn().mockResolvedValue({ reportId: 'ass-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostAdoptionMonitoringController],
      providers: [{ provide: PostAdoptionMonitoringService, useValue: mockService }],
    }).compile();

    controller = module.get<PostAdoptionMonitoringController>(PostAdoptionMonitoringController);
    service = module.get(PostAdoptionMonitoringService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSchedule', () => {
    it('should call monitoringService.getSchedule', async () => {
      const result = await controller.getSchedule({}, 'user-1', Role.PARENT);
      expect(result).toBeDefined();
      expect(service.getSchedule).toHaveBeenCalledWith('user-1', Role.PARENT, {});
    });
  });

  describe('startAssessment', () => {
    it('should call monitoringService.startAssessment', async () => {
      const dto = { childId: 'child-1' };
      const result = await controller.startAssessment(dto, 'user-1', Role.PARENT);
      expect(result).toHaveProperty('assessmentId', 'ass-1');
      expect(service.startAssessment).toHaveBeenCalledWith('user-1', Role.PARENT, dto);
    });
  });

  describe('getQuestions', () => {
    it('should call monitoringService.getQuestions', async () => {
      const result = await controller.getQuestions('child-1');
      expect(result).toHaveProperty('questions');
      expect(service.getQuestions).toHaveBeenCalledWith('child-1');
    });
  });

  describe('uploadFace', () => {
    it('should call monitoringService.uploadFace', async () => {
      const dto = { assessmentId: 'ass-1', imageBase64: 'data:image/png;base64,123' };
      const result = await controller.uploadFace(dto);
      expect(result).toHaveProperty('faceScore', 90);
      expect(service.uploadFace).toHaveBeenCalledWith(dto);
    });
  });

  describe('uploadVoice', () => {
    it('should call monitoringService.uploadVoice', async () => {
      const dto = { assessmentId: 'ass-1', audioBase64: 'data:audio/wav;base64,123' };
      const result = await controller.uploadVoice(dto);
      expect(result).toHaveProperty('voiceScore', 85);
      expect(service.uploadVoice).toHaveBeenCalledWith(dto);
    });
  });

  describe('getReport', () => {
    it('should call monitoringService.getReport', async () => {
      const result = await controller.getReport('ass-1');
      expect(result).toHaveProperty('reportId', 'ass-1');
      expect(service.getReport).toHaveBeenCalledWith('ass-1');
    });
  });
});
