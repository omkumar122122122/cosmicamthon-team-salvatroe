import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssessmentSchedule,
  Assessment,
  Question,
  Answer,
  Prisma,
} from '@prisma/client';

@Injectable()
export class PostAdoptionMonitoringRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Schedule Queries ─────────────────────────────────────────────────────

  async findSchedules(
    where: Prisma.AssessmentScheduleWhereInput,
    skip: number,
    limit: number,
  ): Promise<{ schedules: AssessmentSchedule[]; total: number }> {
    const [schedules, total] = await Promise.all([
      this.prisma.assessmentSchedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nextAssessmentDate: 'asc' },
        include: {
          child: true,
          adoption: {
            include: {
              adoptiveParent: {
                include: { user: true },
              },
            },
          },
        },
      }),
      this.prisma.assessmentSchedule.count({ where }),
    ]);

    return { schedules, total };
  }

  async findScheduleById(id: string): Promise<AssessmentSchedule | null> {
    return this.prisma.assessmentSchedule.findUnique({
      where: { id },
      include: {
        child: true,
        adoption: {
          include: {
            adoptiveParent: {
              include: { user: true },
            },
          },
        },
      },
    });
  }

  async findScheduleByChildAndAdoption(
    childId: string,
    adoptionId: string,
  ): Promise<AssessmentSchedule | null> {
    return this.prisma.assessmentSchedule.findFirst({
      where: {
        childId,
        adoptionId,
        completed: false,
      },
      orderBy: { nextAssessmentDate: 'asc' },
    });
  }

  async createSchedule(
    data: Prisma.AssessmentScheduleCreateInput,
  ): Promise<AssessmentSchedule> {
    return this.prisma.assessmentSchedule.create({ data });
  }

  async updateSchedule(
    id: string,
    data: Prisma.AssessmentScheduleUpdateInput,
  ): Promise<AssessmentSchedule> {
    return this.prisma.assessmentSchedule.update({
      where: { id },
      data,
    });
  }

  // ─── Assessment Queries ──────────────────────────────────────────

  async findAssessmentById(id: string): Promise<any> {
    return this.prisma.assessment.findUnique({
      where: { id },
      include: {
        child: true,
        parent: {
          include: { user: true },
        },
        schedule: true,
        answers: {
          include: { question: true },
        },
      },
    });
  }

  async createAssessment(data: Prisma.AssessmentCreateInput): Promise<Assessment> {
    return this.prisma.assessment.create({ data });
  }

  async findPreviousAssessmentsByChildId(childId: string, currentAssessmentId?: string): Promise<Assessment[]> {
    return this.prisma.assessment.findMany({
      where: {
        childId,
        ...(currentAssessmentId ? { id: { not: currentAssessmentId } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  async updateAssessment(
    id: string,
    data: Prisma.AssessmentUpdateInput,
  ): Promise<Assessment> {
    return this.prisma.assessment.update({
      where: { id },
      data,
    });
  }

  // ─── Transactional Operations ──────────────────────────────────────────

  async submitAssessmentTransaction(params: {
    assessmentId: string;
    assessmentData: Prisma.AssessmentUpdateInput;
    answerDataList: Prisma.AnswerCreateManyInput[];
    scheduleId?: string;
    nextScheduleData?: Prisma.AssessmentScheduleCreateInput;
  }): Promise<Assessment> {
    return this.prisma.$transaction(async (tx) => {
      if (params.answerDataList && params.answerDataList.length > 0) {
        await tx.answer.createMany({ data: params.answerDataList });
      }

      const updatedAssessment = await tx.assessment.update({
        where: { id: params.assessmentId },
        data: params.assessmentData,
      });

      if (params.scheduleId) {
        await tx.assessmentSchedule.update({
          where: { id: params.scheduleId },
          data: { completed: true },
        });
      }

      if (params.nextScheduleData) {
        await tx.assessmentSchedule.create({
          data: params.nextScheduleData,
        });
      }

      return updatedAssessment;
    });
  }

  // ─── Question & Answer Queries ──────────────────────────────────────────

  async findQuestionsByAge(age: number): Promise<Question[]> {
    return this.prisma.question.findMany({
      where: {
        minAge: { lte: age },
        maxAge: { gte: age },
      },
      orderBy: { category: 'asc' },
    });
  }

  async findQuestionsByIds(ids: string[]): Promise<Question[]> {
    return this.prisma.question.findMany({
      where: { id: { in: ids } },
    });
  }

  async createAnswer(data: Prisma.AnswerCreateInput): Promise<Answer> {
    return this.prisma.answer.create({ data });
  }

  async createManyAnswers(data: Prisma.AnswerCreateManyInput[]): Promise<number> {
    const res = await this.prisma.answer.createMany({ data });
    return res.count;
  }

  // ─── Helper Lookups ──────────────────────────────────────────

  async findChildById(childId: string) {
    return this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        adoptionRecord: {
          include: {
            adoptiveParent: {
              include: { user: true },
            },
          },
        },
      },
    });
  }

  async findParentByUserId(userId: string) {
    return this.prisma.parent.findFirst({
      where: { userId },
      include: { user: true },
    });
  }

  async findAdoptionByChildId(childId: string) {
    return this.prisma.adoptionRecord.findFirst({
      where: { childId, status: 'COMPLETED' },
      include: { adoptiveParent: true, child: true },
    });
  }
}
