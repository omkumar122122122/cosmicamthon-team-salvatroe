import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Role, AlertSeverity, AlertType, RiskLevel, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PostAdoptionMonitoringRepository } from './post-adoption-monitoring.repository';
import { AlertsGenerationService } from '../alerts/alerts-generation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueryScheduleDto } from './dto/query-schedule.dto';
import { StartAssessmentDto } from './dto/start-assessment.dto';
import { UploadFaceDto } from './dto/upload-face.dto';
import { UploadVoiceDto } from './dto/upload-voice.dto';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

// AI Services
import { FaceAnalysisService } from './ai/face-analysis.service';
import { VoiceAnalysisService } from './ai/voice-analysis.service';
import { SpeechService } from './ai/speech.service';
import { AnswerAnalysisService } from './ai/answer-analysis.service';
import { AIAnalysisService } from './ai/ai-analysis.service';

@Injectable()
export class PostAdoptionMonitoringService {
  private readonly logger = new Logger(PostAdoptionMonitoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PostAdoptionMonitoringRepository,
    private readonly alertsGenerationService: AlertsGenerationService,
    private readonly notificationsService: NotificationsService,
    public readonly faceAnalysisService: FaceAnalysisService,
    public readonly voiceAnalysisService: VoiceAnalysisService,
    public readonly speechService: SpeechService,
    public readonly answerAnalysisService: AnswerAnalysisService,
    public readonly aiAnalysisService: AIAnalysisService,
  ) {}

  /**
   * Helper: Validates that if the current user is a PARENT, they are the legally authorized adoptive parent of the child.
   */
  async validateParentChildAuthorization(userId: string, userRole: any, childId: string): Promise<void> {
    if (userRole === Role.PARENT) {
      const parent = await this.repository.findParentByUserId(userId);
      if (!parent) {
        throw new ForbiddenException('Access denied: Parent profile not found');
      }

      const adoption = await this.repository.findAdoptionByChildId(childId);
      if (!adoption || adoption.adoptiveParentId !== parent.id) {
        throw new ForbiddenException('Access denied: You are not the legally authorized adoptive parent for this child');
      }
    }
  }

  // ─── GET /post-adoption/schedule ──────────────────────────────────────────

  async getSchedule(userId: string, userRole: any, query: QueryScheduleDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.adoptionId) where.adoptionId = query.adoptionId;
    if (query.childId) where.childId = query.childId;
    if (query.completed !== undefined) where.completed = query.completed;

    if (userRole === Role.PARENT) {
      const parent = await this.repository.findParentByUserId(userId);
      if (!parent) {
        throw new NotFoundException('Parent profile not found');
      }
      where.adoption = { adoptiveParentId: parent.id };

      if (query.childId) {
        await this.validateParentChildAuthorization(userId, userRole, query.childId);
        const adoptions = await this.repository.findAdoptionByChildId(query.childId);
        if (adoptions && adoptions.adoptiveParentId === parent.id) {
          await this.ensureChildSchedule(adoptions.id, adoptions.childId, adoptions.child);
        }
      }
    }

    const { schedules, total } = await this.repository.findSchedules(where, skip, limit);

    return {
      data: schedules,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // ─── POST /post-adoption/start ─────────────────────────────────────────────

  async startAssessment(userId: string, userRole: any, dto: StartAssessmentDto) {
    await this.validateParentChildAuthorization(userId, userRole, dto.childId);

    const parent = await this.repository.findParentByUserId(userId);
    if (!parent && userRole === Role.PARENT) {
      throw new NotFoundException('Parent profile not found');
    }

    const child = await this.repository.findChildById(dto.childId);
    if (!child) {
      throw new NotFoundException('Child record not found');
    }

    const childAge = this.calculateChildAge(child.dateOfBirth, child.approximateAge);
    if (childAge >= 16) {
      throw new BadRequestException('Post-adoption welfare assessments apply to children under the age of 16');
    }

    const adoption = await this.repository.findAdoptionByChildId(dto.childId);
    if (!adoption) {
      throw new NotFoundException('Active adoption record not found for this child');
    }

    let schedule = dto.scheduleId
      ? await this.repository.findScheduleById(dto.scheduleId)
      : await this.repository.findScheduleByChildAndAdoption(dto.childId, adoption.id);

    if (!schedule) {
      schedule = await this.ensureChildSchedule(adoption.id, child.id, child);
    }

    const parentId = parent ? parent.id : adoption.adoptiveParentId || '';

    const assessment = await this.repository.createAssessment({
      schedule: { connect: { id: schedule.id } },
      child: { connect: { id: child.id } },
      parent: { connect: { id: parentId } },
      assessmentDate: new Date(),
      faceScore: 0,
      voiceScore: 0,
      answerScore: 0,
      behaviorScore: 0,
      overallRisk: RiskLevel.LOW,
      summary: 'Assessment session initialized',
      recommendation: 'Complete questions, face analysis, and voice analysis',
    });

    this.logger.log(`Assessment session ${assessment.id} started for child ${child.id}`);

    return {
      message: 'Assessment session started successfully',
      assessmentId: assessment.id,
      scheduleId: schedule.id,
      childId: child.id,
      childAge,
      nextAssessmentDate: schedule.nextAssessmentDate,
    };
  }

  // ─── GET /post-adoption/questions/:childId ────────────────────────────────

  async getQuestions(childId: string) {
    const child = await this.repository.findChildById(childId);
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const childAge = this.calculateChildAge(child.dateOfBirth, child.approximateAge);
    let questions = await this.repository.findQuestionsByAge(childAge);

    if (questions.length === 0) {
      questions = await this.repository.findQuestionsByAge(8);
    }

    return {
      childId,
      childAge,
      totalQuestions: questions.length,
      questions,
    };
  }

  // ─── POST /post-adoption/upload-face ──────────────────────────────────────

  async uploadFace(dto: UploadFaceDto) {
    const assessment = await this.repository.findAssessmentById(dto.assessmentId);
    if (!assessment) {
      throw new NotFoundException('Assessment session not found');
    }

    // Invoke FaceAnalysisService
    const faceResult = await this.faceAnalysisService.analyzeFace(
      dto.imageBase64 || dto.imageUrl,
    );

    await this.repository.updateAssessment(dto.assessmentId, {
      faceScore: faceResult.faceScore,
    });

    return {
      assessmentId: dto.assessmentId,
      faceScore: faceResult.faceScore,
      dominantEmotion: faceResult.dominantEmotion,
      emotions: faceResult.emotions,
      welfareSign: faceResult.welfareSign,
    };
  }

  // ─── POST /post-adoption/upload-voice ─────────────────────────────────────

  async uploadVoice(dto: UploadVoiceDto) {
    const assessment = await this.repository.findAssessmentById(dto.assessmentId);
    if (!assessment) {
      throw new NotFoundException('Assessment session not found');
    }

    // Speech-to-Text Transcription via Whisper
    const transcription = await this.speechService.transcribeAudio(
      dto.audioBase64 || dto.audioUrl,
    );

    // Invoke VoiceAnalysisService (Speech Emotion Recognition)
    const voiceResult = await this.voiceAnalysisService.analyzeVoice(
      dto.audioBase64 || dto.audioUrl,
    );

    await this.repository.updateAssessment(dto.assessmentId, {
      voiceScore: voiceResult.voiceScore,
    });

    return {
      assessmentId: dto.assessmentId,
      voiceScore: voiceResult.voiceScore,
      emotions: voiceResult.emotions,
      transcription,
      vocalHealth: voiceResult.vocalHealth,
    };
  }

  // ─── POST /post-adoption/submit ───────────────────────────────────────────

  async submitAssessment(dto: SubmitAssessmentDto) {
    const assessment = await this.repository.findAssessmentById(dto.assessmentId);
    if (!assessment) {
      throw new NotFoundException('Assessment session not found');
    }

    // Fetch questions for answers mapping
    const questionIds = dto.answers.map((a) => a.questionId);
    const dbQuestions = await this.repository.findQuestionsByIds(questionIds);
    const qMap = new Map(dbQuestions.map((q) => [q.id, q.question]));

    // Analyze answers via Hugging Face LLM
    const processedAnswers = [];
    const answerDataList = [];

    for (const ans of dto.answers) {
      const qText = qMap.get(ans.questionId) || 'Child welfare assessment question';
      const aiAnalysis = await this.answerAnalysisService.analyzeAnswer(qText, ans.answer);

      processedAnswers.push({
        questionId: ans.questionId,
        questionText: qText,
        answer: ans.answer,
        analysis: aiAnalysis,
      });

      answerDataList.push({
        assessmentId: dto.assessmentId,
        questionId: ans.questionId,
        answer: ans.answer,
        sentiment: aiAnalysis.sentiment,
        confidence: aiAnalysis.confidence,
      });
    }

    // Fetch previous 6-month historical assessments for child
    const previousAssessments = await this.repository.findPreviousAssessmentsByChildId(
      assessment.childId,
      assessment.id,
    );

    // Run Master AI Evaluation & RiskEngineService
    const aiEvaluation = await this.aiAnalysisService.evaluateAssessment({
      assessmentId: dto.assessmentId,
      imageBase64OrUrl: undefined,
      audioBase64OrUrl: undefined,
      answers: dto.answers,
      previousAssessments,
    });

    const faceScore = dto.faceScore ?? assessment.faceScore ?? aiEvaluation.faceResult.faceScore;
    const voiceScore = dto.voiceScore ?? assessment.voiceScore ?? aiEvaluation.voiceResult.voiceScore;
    const behaviorScore = dto.behaviorScore ?? 92;

    const overallScore = aiEvaluation.overallScore;
    const overallRisk = aiEvaluation.overallRisk;
    const summary = aiEvaluation.summary;
    const recommendation = aiEvaluation.recommendation;

    // Auto-schedule next 6-month assessment if child under 16
    const childAge = this.calculateChildAge(assessment.child.dateOfBirth, assessment.child.approximateAge);
    let nextScheduleDate: Date | null = null;
    let nextScheduleData: Prisma.AssessmentScheduleCreateInput | undefined;

    if (childAge < 16) {
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 6);
      nextScheduleDate = nextDate;

      const adoption = await this.repository.findAdoptionByChildId(assessment.childId);
      if (adoption) {
        nextScheduleData = {
          adoption: { connect: { id: adoption.id } },
          child: { connect: { id: assessment.childId } },
          nextAssessmentDate: nextDate,
          frequencyMonths: 6,
          completed: false,
        };
      }
    }

    // Execute Prisma Transaction for atomic state changes
    const updatedAssessment = await this.repository.submitAssessmentTransaction({
      assessmentId: dto.assessmentId,
      assessmentData: {
        faceScore,
        voiceScore,
        answerScore: Math.round(overallScore),
        behaviorScore,
        overallRisk,
        summary,
        recommendation,
      },
      answerDataList,
      scheduleId: assessment.scheduleId || undefined,
      nextScheduleData,
    });

    // Integrate with existing Alert module & send admin notifications if overallRisk >= HIGH
    if (overallRisk === RiskLevel.HIGH || overallRisk === RiskLevel.CRITICAL) {
      const childName = `${assessment.child.firstName} ${assessment.child.lastName || ''}`.trim();
      const childId = assessment.child.id;
      const parentName = `${assessment.parent.user?.firstName || ''} ${assessment.parent.user?.lastName || ''}`.trim();
      const assessmentDate = assessment.assessmentDate.toISOString();
      const riskScore = aiEvaluation.riskEvaluation ? aiEvaluation.riskEvaluation.riskScore : (overallRisk === RiskLevel.CRITICAL ? 85 : 68);

      const formattedDetails = `Post Adoption Welfare Alert Details:
- Child Name: ${childName}
- Child ID: ${childId}
- Parent Name: ${parentName}
- Assessment Date: ${assessmentDate}
- Risk Percentage: ${riskScore}%
- Risk Level: ${overallRisk}
- Summary: ${summary}
- Recommendation: ${recommendation}`;

      // Create Alert in existing Alert entity
      await this.alertsGenerationService.triggerAlert({
        type: AlertType.AI_RISK_SPIKE,
        severity: overallRisk === RiskLevel.CRITICAL ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
        title: `Post Adoption Welfare Risk Alert: ${childName} (${overallRisk})`,
        details: formattedDetails,
        childId: assessment.childId,
        parentId: assessment.parentId,
        sourceService: 'PostAdoptionMonitoringService',
        metadata: {
          alertType: 'Post Adoption Welfare',
          childName,
          childId,
          parentName,
          assessmentDate,
          riskPercentage: `${riskScore}%`,
          riskLevel: overallRisk,
          summary,
          recommendation,
          priority: overallRisk === RiskLevel.CRITICAL ? 'CRITICAL' : 'HIGH',
          status: 'Unread',
        },
      });

      // Send Notification to all Admins
      try {
        const adminUsers = await this.prisma.user.findMany({
          where: { role: Role.ADMIN },
        });

        for (const admin of adminUsers) {
          await this.notificationsService.create({
            userId: admin.id,
            type: NotificationType.ALERT_RAISED,
            title: `Post Adoption Welfare Alert: ${childName}`,
            body: `Child: ${childName} (${childId}), Parent: ${parentName}, Risk Level: ${overallRisk} (${riskScore}%). ${summary}`,
            relatedEntityType: 'Alert',
            relatedEntityId: assessment.id,
          });
        }
      } catch (err: any) {
        this.logger.warn(`Admin notification warning: ${err?.message || err}`);
      }

      this.logger.warn(`Triggered safety alert for assessment ${assessment.id} (${overallRisk} risk)`);
    }

    return {
      message: 'Assessment submitted successfully with AI evaluation',
      assessmentId: updatedAssessment.id,
      overallScore,
      overallRisk,
      summary,
      recommendation,
      nextAssessmentDate: nextScheduleDate,
      aiBreakdown: {
        faceEmotions: aiEvaluation.faceResult.emotions,
        voiceEmotions: aiEvaluation.voiceResult.emotions,
        processedAnswers,
      },
    };
  }

  // ─── GET /post-adoption/report/:id ────────────────────────────────────────

  async getReport(id: string) {
    const assessment = await this.repository.findAssessmentById(id);
    if (!assessment) {
      throw new NotFoundException('Assessment report not found');
    }

    const childAge = this.calculateChildAge(assessment.child.dateOfBirth, assessment.child.approximateAge);

    return {
      reportId: assessment.id,
      assessmentDate: assessment.assessmentDate,
      child: {
        id: assessment.child.id,
        childCode: assessment.child.childCode,
        fullName: `${assessment.child.firstName} ${assessment.child.lastName || ''}`.trim(),
        age: childAge,
        gender: assessment.child.gender,
      },
      parent: {
        id: assessment.parent.id,
        fullName: `${assessment.parent.user?.firstName || ''} ${assessment.parent.user?.lastName || ''}`.trim(),
        email: assessment.parent.user?.email,
        phone: assessment.parent.user?.phone,
      },
      scores: {
        faceScore: assessment.faceScore,
        voiceScore: assessment.voiceScore,
        answerScore: assessment.answerScore,
        behaviorScore: assessment.behaviorScore,
      },
      overallRisk: assessment.overallRisk,
      summary: assessment.summary,
      recommendation: assessment.recommendation,
      answers: assessment.answers.map((a: any) => ({
        id: a.id,
        question: a.question?.question,
        category: a.question?.category,
        answer: a.answer,
        sentiment: a.sentiment,
        confidence: a.confidence,
      })),
      schedule: assessment.schedule
        ? {
            id: assessment.schedule.id,
            nextAssessmentDate: assessment.schedule.nextAssessmentDate,
            completed: assessment.schedule.completed,
          }
        : null,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private calculateChildAge(dob: Date | null, approxAge: number | null): number {
    if (dob) {
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return approxAge || 8;
  }

  private async ensureChildSchedule(adoptionId: string, childId: string, child: any) {
    const existing = await this.repository.findScheduleByChildAndAdoption(childId, adoptionId);
    if (existing) return existing;

    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 6);

    return this.repository.createSchedule({
      adoption: { connect: { id: adoptionId } },
      child: { connect: { id: childId } },
      nextAssessmentDate: nextDate,
      frequencyMonths: 6,
      completed: false,
    });
  }
}
