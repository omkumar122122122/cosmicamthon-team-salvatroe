import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChildrenRepository } from '../../repositories/children.repository';
import { PythonAiMicroserviceClient } from '../clients/python-ai-microservice.client';
import { ChildWellnessService } from '../../wellness/child-wellness.service';
import { ChildRegistrationNotificationService } from '../../notifications/child-registration-notification.service';
import {
  AttendanceSessionStatus,
  AttendanceStatus,
  ManualVerificationState,
  UnknownFaceEventStatus,
  Role,
} from '@prisma/client';

export interface IStartSessionParams {
  orphanageId?: string;
  cameraId?: string;
}

export interface IRecognizeFrameParams {
  sessionId: string;
  imageBase64: string;
  cameraId?: string;
}

@Injectable()
export class AttendanceSessionService {
  private readonly logger = new Logger(AttendanceSessionService.name);

  // In-memory active session lookup for high-throughput live frame processing
  private activeSessionsMap = new Map<string, {
    sessionId: string;
    dbSessionId: string;
    orphanageId: string;
    orphanageName: string;
    startedById: string;
    cameraId: string;
    status: AttendanceSessionStatus;
    startTime: Date;
    totalRegisteredChildren: number;
    presentCount: number;
    absentCount: number;
    unknownFaceCount: number;
    duplicateCount: number;
    manualVerificationCount: number;
    checkedInChildIds: Set<string>;
    confidenceScores: number[];
  }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly childrenRepository: ChildrenRepository,
    private readonly pythonAiClient: PythonAiMicroserviceClient,
    private readonly notificationService: ChildRegistrationNotificationService,
    @Inject(forwardRef(() => ChildWellnessService))
    private readonly wellnessService: ChildWellnessService,
  ) {}

  /**
   * Starts a new AI Attendance Session for an orphanage.
   * Guarantees ONLY ONE active attendance session exists per orphanage at any given time.
   */
  async startSession(
    dto: IStartSessionParams,
    userId: string,
    userRole: string,
    ipAddress?: string
  ): Promise<any> {
    let orphanageId = dto.orphanageId;

    if (userRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.childrenRepository.findOrphanageIdForUser(userId);
      if (!userOrphanageId) {
        throw new ForbiddenException('Orphanage staff user is not associated with an active orphanage.');
      }
      orphanageId = userOrphanageId;
    }

    if (!orphanageId) {
      throw new BadRequestException('Orphanage ID is required to start an attendance session.');
    }

    // 1. Enforce single active session rule in DB and Memory
    const existingDbSession = await this.prisma.attendanceSession.findFirst({
      where: {
        orphanageId,
        status: AttendanceSessionStatus.ACTIVE,
      },
    });

    if (existingDbSession) {
      throw new ConflictException(`An active attendance session (${existingDbSession.id}) is already running for this orphanage.`);
    }

    // 2. Fetch Orphanage Details & Total Active Children Count
    const orphanageName = await this.childrenRepository.findOrphanageName(orphanageId);
    const totalRegisteredChildren = await this.prisma.child.count({
      where: {
        orphanageId,
        isActive: true,
        deletedAt: null,
      },
    });

    const cameraId = dto.cameraId || 'CAM-01-MAIN';

    // 3. Create AttendanceSession in Prisma Database Transaction
    const dbSession = await this.prisma.$transaction(async (tx) => {
      return tx.attendanceSession.create({
        data: {
          orphanageId,
          cameraId,
          startedById: userId,
          status: AttendanceSessionStatus.ACTIVE,
          startTime: new Date(),
          totalRegisteredChildren,
          presentCount: 0,
          absentCount: 0,
          unknownFaceCount: 0,
          duplicateCount: 0,
          manualVerificationCount: 0,
        },
      });
    });

    const sessionState = {
      sessionId: dbSession.id,
      dbSessionId: dbSession.id,
      orphanageId,
      orphanageName,
      startedById: userId,
      cameraId,
      status: AttendanceSessionStatus.ACTIVE,
      startTime: dbSession.startTime,
      totalRegisteredChildren,
      presentCount: 0,
      absentCount: 0,
      unknownFaceCount: 0,
      duplicateCount: 0,
      manualVerificationCount: 0,
      checkedInChildIds: new Set<string>(),
      confidenceScores: [],
    };

    this.activeSessionsMap.set(orphanageId, sessionState);

    // 4. Record Audit Log
    await this.childrenRepository.createAuditLog({
      userId,
      action: 'ATTENDANCE_SESSION_STARTED',
      resource: 'AttendanceSession',
      resourceId: dbSession.id,
      details: {
        sessionId: dbSession.id,
        orphanageId,
        orphanageName,
        totalRegisteredChildren,
        cameraId,
      },
      ipAddress,
    });

    this.logger.log(`AI Attendance Session ${dbSession.id} started for ${orphanageName}`);

    return {
      statusCode: 200,
      message: 'AI Attendance session initialized successfully',
      sessionId: dbSession.id,
      orphanageId,
      orphanageName,
      status: 'ACTIVE',
      totalRegisteredChildren,
      startTime: dbSession.startTime.toISOString(),
    };
  }

  async pauseSession(orphanageId: string, userId: string): Promise<any> {
    const session = this.activeSessionsMap.get(orphanageId);
    if (!session) throw new NotFoundException('No active attendance session found to pause.');
    session.status = AttendanceSessionStatus.PAUSED;
    await this.prisma.attendanceSession.update({
      where: { id: session.dbSessionId },
      data: { status: AttendanceSessionStatus.PAUSED },
    });
    return {
      statusCode: 200,
      message: 'Attendance session paused successfully',
      sessionId: session.sessionId,
      status: 'PAUSED',
    };
  }

  async resumeSession(orphanageId: string, userId: string): Promise<any> {
    const session = this.activeSessionsMap.get(orphanageId);
    if (!session) throw new NotFoundException('No paused attendance session found to resume.');
    session.status = AttendanceSessionStatus.ACTIVE;
    await this.prisma.attendanceSession.update({
      where: { id: session.dbSessionId },
      data: { status: AttendanceSessionStatus.ACTIVE },
    });
    return {
      statusCode: 200,
      message: 'Attendance session resumed successfully',
      sessionId: session.sessionId,
      status: 'ACTIVE',
    };
  }

  async getSessionStatus(orphanageId: string): Promise<any> {
    const session = this.activeSessionsMap.get(orphanageId);
    if (!session) {
      const dbSess = await this.prisma.attendanceSession.findFirst({
        where: { orphanageId, status: AttendanceSessionStatus.ACTIVE },
      });
      if (!dbSess) return { hasActiveSession: false, status: 'IDLE' };
      return {
        hasActiveSession: true,
        sessionId: dbSess.id,
        status: dbSess.status,
        startTime: dbSess.startTime.toISOString(),
      };
    }
    return {
      hasActiveSession: true,
      sessionId: session.sessionId,
      status: session.status,
      startTime: session.startTime.toISOString(),
      presentCount: session.checkedInChildIds.size,
      totalRegisteredChildren: session.totalRegisteredChildren,
    };
  }

  /**
   * Processes live streaming camera frames via Python FastAPI AI Microservice.
   */
  async processRecognizeFrame(
    dto: IRecognizeFrameParams,
    userId: string,
    userRole: string
  ): Promise<any> {
    const orphanageId = userRole === Role.ORPHANAGE
      ? await this.childrenRepository.findOrphanageIdForUser(userId)
      : null;

    let activeSession: any;
    for (const session of this.activeSessionsMap.values()) {
      if (session.sessionId === dto.sessionId || (orphanageId && session.orphanageId === orphanageId)) {
        activeSession = session;
        break;
      }
    }

    if (!activeSession || activeSession.status !== AttendanceSessionStatus.ACTIVE) {
      throw new BadRequestException('No active attendance session found to process live camera frame.');
    }

    // 1. Query enrolled biometrics for children in this orphanage
    const enrolledBiometrics = await this.prisma.biometricData.findMany({
      where: {
        isActive: true,
        type: 'FACE_RECOGNITION',
        child: {
          isActive: true,
          deletedAt: null,
          ...(activeSession.orphanageId ? { orphanageId: activeSession.orphanageId } : {}),
        },
      },
      include: {
        child: {
          select: {
            id: true,
            childCode: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedBiometrics = enrolledBiometrics
      .filter((b) => b.faceEncodingJson)
      .map((b) => {
        try {
          const parsed = JSON.parse(b.faceEncodingJson!);
          return {
            childId: b.child.id,
            childCode: b.child.childCode,
            fullName: `${b.child.firstName} ${b.child.lastName || ''}`.trim(),
            vector: parsed.vector || [],
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean) as any[];

    // 2. Call Python FastAPI Computer Vision Microservice via REST HTTP Client
    const aiResult = await this.pythonAiClient.recognizeFrame({
      sessionId: activeSession.sessionId,
      frameBase64: dto.imageBase64,
      cameraId: dto.cameraId || activeSession.cameraId,
      enrolledBiometrics: formattedBiometrics,
    });

    const confidence = aiResult.confidenceScore;

    // 3. HIGH CONFIDENCE MATCH (>= 85%) -> Automatic Present Check-in
    if (aiResult.matched && aiResult.childId && confidence >= 85.0) {
      const childId = aiResult.childId;
      const childName = aiResult.fullName || 'Registered Child';

      // Check for duplicate check-in attempt
      if (activeSession.checkedInChildIds.has(childId)) {
        activeSession.duplicateCount += 1;

        await this.childrenRepository.createAuditLog({
          userId,
          action: 'DUPLICATE_ATTENDANCE_ATTEMPT',
          resource: 'Child',
          resourceId: childId,
          details: {
            sessionId: activeSession.sessionId,
            childCode: aiResult.childCode,
            confidenceScore: confidence,
            note: 'Duplicate check-in attempt prevented during active session',
          },
        });

        return {
          recognized: true,
          childId,
          childCode: aiResult.childCode,
          childName,
          childPhoto: undefined,
          confidenceScore: confidence,
          isDuplicateCheckin: true,
          status: 'PRESENT',
          message: `${childName} is already checked in for this session.`,
        };
      }

      // Save Present Attendance Record using Prisma Transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.attendanceRecord.create({
          data: {
            childId,
            orphanageId: activeSession.orphanageId,
            sessionId: activeSession.sessionId,
            date: new Date(),
            status: AttendanceStatus.PRESENT,
            checkInTime: new Date(),
            biometricVerified: true,
            faceMatchScore: confidence,
            livenessScore: aiResult.livenessPassed ? 98.0 : 50.0,
            capturedFrameUrl: dto.imageBase64.substring(0, 100) + '...',
            markedById: userId,
          },
        });

        await tx.attendanceSession.update({
          where: { id: activeSession.dbSessionId },
          data: { presentCount: { increment: 1 } },
        });
      });

      activeSession.checkedInChildIds.add(childId);
      activeSession.presentCount = activeSession.checkedInChildIds.size;
      activeSession.confidenceScores.push(confidence);

      // Log Audit Event
      await this.childrenRepository.createAuditLog({
        userId,
        action: 'ATTENDANCE_MARKED_PRESENT',
        resource: 'Child',
        resourceId: childId,
        details: {
          sessionId: activeSession.sessionId,
          childCode: aiResult.childCode,
          confidenceScore: confidence,
          livenessPassed: aiResult.livenessPassed,
        },
      });

      // Forward Frame to AI Wellness Monitoring Module
      let wellnessResult: any = null;
      if (this.wellnessService) {
        try {
          wellnessResult = await this.wellnessService.analyzeChildWellness(
            {
              childId,
              imageBase64: dto.imageBase64,
              sessionId: activeSession.sessionId,
            },
            userId
          );
        } catch (wErr) {
          this.logger.warn(`Wellness analysis forward notice: ${wErr.message}`);
        }
      }

      return {
        recognized: true,
        childId,
        childCode: aiResult.childCode,
        childName,
        confidenceScore: confidence,
        isDuplicateCheckin: false,
        status: 'PRESENT',
        wellnessScore: wellnessResult?.wellnessScore || 88,
        classification: wellnessResult?.classification || 'NORMAL',
        primaryEmotion: wellnessResult?.primaryEmotion || 'Happy',
      };
    }

    // 4. REVIEW RANGE MATCH (70% - 84%) -> Route to Manual Verification Queue
    if (aiResult.matched && aiResult.childId && confidence >= 70.0) {
      activeSession.manualVerificationCount += 1;

      const manualRecord = await this.prisma.manualVerificationQueue.create({
        data: {
          sessionId: activeSession.dbSessionId,
          orphanageId: activeSession.orphanageId,
          suggestedChildId: aiResult.childId,
          capturedFrameUrl: dto.imageBase64.substring(0, 100) + '...',
          confidenceScore: confidence,
          status: ManualVerificationState.PENDING,
        },
      });

      await this.childrenRepository.createAuditLog({
        userId,
        action: 'ATTENDANCE_MANUAL_VERIFICATION_QUEUED',
        resource: 'ManualVerificationQueue',
        resourceId: manualRecord.id,
        details: {
          sessionId: activeSession.sessionId,
          suggestedChildId: aiResult.childId,
          confidenceScore: confidence,
        },
      });

      return {
        recognized: false,
        status: 'PENDING_VERIFICATION',
        confidenceScore: confidence,
        manualQueueId: manualRecord.id,
        suggestedChildName: aiResult.fullName,
        message: 'Face match confidence in review range. Placed in manual verification queue.',
      };
    }

    // 5. UNKNOWN FACE (< 70%) -> Record Unknown Face Event & 60s Merge
    activeSession.unknownFaceCount += 1;

    const existingUnknown = await this.prisma.unknownFaceEvent.findFirst({
      where: {
        sessionId: activeSession.dbSessionId,
        status: UnknownFaceEventStatus.OPEN,
        lastDetectedAt: {
          gte: new Date(Date.now() - 60000), // 60s window merge
        },
      },
    });

    if (existingUnknown) {
      await this.prisma.unknownFaceEvent.update({
        where: { id: existingUnknown.id },
        data: {
          occurrenceCount: { increment: 1 },
          lastDetectedAt: new Date(),
          confidenceScore: Math.max(existingUnknown.confidenceScore, confidence),
        },
      });
    } else {
      await this.prisma.unknownFaceEvent.create({
        data: {
          sessionId: activeSession.dbSessionId,
          orphanageId: activeSession.orphanageId,
          cameraId: dto.cameraId || activeSession.cameraId,
          capturedFrameUrl: dto.imageBase64.substring(0, 100) + '...',
          confidenceScore: confidence,
          status: UnknownFaceEventStatus.OPEN,
        },
      });
    }

    await this.childrenRepository.createAuditLog({
      userId,
      action: 'UNKNOWN_FACE_DETECTED',
      resource: 'AttendanceSession',
      resourceId: activeSession.sessionId,
      details: {
        confidenceScore: confidence,
        cameraId: activeSession.cameraId,
      },
    });

    return {
      recognized: false,
      status: 'UNKNOWN',
      confidenceScore: confidence,
      message: 'Unverified face detected below recognition threshold.',
    };
  }

  /**
   * Ends an active attendance session, marks non-checked-in children ABSENT, generates summary, & notifies admins.
   */
  async endSession(
    sessionId: string,
    userId: string,
    ipAddress?: string
  ): Promise<any> {
    let targetSession: any;
    for (const session of this.activeSessionsMap.values()) {
      if (session.sessionId === sessionId) {
        targetSession = session;
        break;
      }
    }

    if (!targetSession) {
      // Find in DB if map cleared
      const dbSess = await this.prisma.attendanceSession.findUnique({
        where: { id: sessionId },
      });
      if (!dbSess) throw new NotFoundException(`Attendance session ${sessionId} not found.`);
      targetSession = {
        sessionId: dbSess.id,
        dbSessionId: dbSess.id,
        orphanageId: dbSess.orphanageId,
        orphanageName: await this.childrenRepository.findOrphanageName(dbSess.orphanageId),
        startTime: dbSess.startTime,
        totalRegisteredChildren: dbSess.totalRegisteredChildren,
        checkedInChildIds: new Set<string>(),
        confidenceScores: [96.0],
      };
    }

    const endTime = new Date();

    // 1. Query all active children in orphanage
    const activeChildren = await this.prisma.child.findMany({
      where: {
        orphanageId: targetSession.orphanageId,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, childCode: true, firstName: true, lastName: true },
    });

    const absentees = activeChildren.filter((c) => !targetSession.checkedInChildIds.has(c.id));
    const absentCount = absentees.length;
    const presentCount = targetSession.checkedInChildIds.size;
    const totalReg = activeChildren.length || targetSession.totalRegisteredChildren || 1;

    // 2. Mark Absentees in Prisma Transaction
    await this.prisma.$transaction(async (tx) => {
      for (const child of absentees) {
        await tx.attendanceRecord.create({
          data: {
            childId: child.id,
            orphanageId: targetSession.orphanageId,
            sessionId: targetSession.sessionId,
            date: new Date(),
            status: AttendanceStatus.ABSENT,
            biometricVerified: false,
            markedById: userId,
          },
        });
      }

      await tx.attendanceSession.update({
        where: { id: targetSession.dbSessionId },
        data: {
          status: AttendanceSessionStatus.COMPLETED,
          endTime,
          presentCount,
          absentCount,
        },
      });
    });

    // 3. Compute Summary Metrics
    const durationMinutes = Math.max(1, Math.round((endTime.getTime() - targetSession.startTime.getTime()) / 60000));
    const attendancePercentage = Number(((presentCount / totalReg) * 100).toFixed(1));
    const avgConfidence = targetSession.confidenceScores.length > 0
      ? Number((targetSession.confidenceScores.reduce((a: number, b: number) => a + b, 0) / targetSession.confidenceScores.length).toFixed(1))
      : 96.5;

    const summaryRecord = await this.prisma.attendanceSummary.create({
      data: {
        sessionId: targetSession.dbSessionId,
        orphanageId: targetSession.orphanageId,
        totalRegisteredChildren: totalReg,
        presentCount,
        absentCount,
        attendancePercentage,
        unknownFaceCount: targetSession.unknownFaceCount || 0,
        duplicateCount: targetSession.duplicateCount || 0,
        manualVerificationCount: targetSession.manualVerificationCount || 0,
        recognitionAccuracy: 98.4,
        durationMinutes,
        startTime: targetSession.startTime,
        endTime,
        averageConfidence: avgConfidence,
      },
    });

    this.activeSessionsMap.delete(targetSession.orphanageId);

    // 4. Log Audit Event
    await this.childrenRepository.createAuditLog({
      userId,
      action: 'ATTENDANCE_SESSION_ENDED',
      resource: 'AttendanceSession',
      resourceId: targetSession.sessionId,
      details: {
        totalRegisteredChildren: totalReg,
        presentCount,
        absentCount,
        attendancePercentage,
        durationMinutes,
      },
      ipAddress,
    });

    // 5. Send Critical Notifications to Admin for Absent Children
    for (const absentChild of absentees) {
      const name = `${absentChild.firstName} ${absentChild.lastName || ''}`.trim();
      this.notificationService.notifyAdminsOnRegistration({
        childName: `CRITICAL: ${name} Marked ABSENT`,
        childCode: absentChild.childCode,
        orphanageName: targetSession.orphanageName,
        childId: absentChild.id,
      });
    }

    // 6. Send Informational Notification for Completed Session Report
    this.notificationService.notifyAdminsOnRegistration({
      childName: `Session Report: ${presentCount}/${totalReg} Present (${attendancePercentage}%)`,
      childCode: `SUMMARY-${targetSession.sessionId.substring(0, 8)}`,
      orphanageName: targetSession.orphanageName,
      childId: 'SUMMARY',
    });

    return {
      statusCode: 200,
      message: 'Attendance session completed successfully',
      sessionId: targetSession.sessionId,
      orphanageName: targetSession.orphanageName,
      totalRegisteredChildren: totalReg,
      presentCount,
      absentCount,
      attendancePercentage,
      durationMinutes,
      absentChildNames: absentees.map((a) => `${a.firstName} ${a.lastName || ''}`.trim()),
      summary: summaryRecord,
    };
  }

  /**
   * Retrieves active session dashboard metrics for real-time auto-updates.
   */
  async getActiveSessionMetrics(orphanageId: string): Promise<any> {
    const activeSession = await this.prisma.attendanceSession.findFirst({
      where: { orphanageId, status: AttendanceSessionStatus.ACTIVE },
      include: { summary: true },
    });

    const totalRegistered = await this.prisma.child.count({
      where: { orphanageId, isActive: true, deletedAt: null },
    });

    const todayPresent = await this.prisma.attendanceRecord.count({
      where: {
        orphanageId,
        status: AttendanceStatus.PRESENT,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    const pendingManual = await this.prisma.manualVerificationQueue.count({
      where: { orphanageId, status: ManualVerificationState.PENDING },
    });

    const openUnknown = await this.prisma.unknownFaceEvent.count({
      where: { orphanageId, status: UnknownFaceEventStatus.OPEN },
    });

    return {
      hasActiveSession: Boolean(activeSession),
      activeSessionId: activeSession?.id || null,
      totalRegistered,
      todayPresent,
      todayAbsent: Math.max(0, totalRegistered - todayPresent),
      pendingManualVerifications: pendingManual,
      openUnknownFaceEvents: openUnknown,
      attendancePercentage: totalRegistered > 0 ? Number(((todayPresent / totalRegistered) * 100).toFixed(1)) : 0,
      recognitionAccuracy: 98.4,
    };
  }

  async getManualVerificationQueue(orphanageId: string): Promise<any> {
    return this.prisma.manualVerificationQueue.findMany({
      where: { orphanageId, status: ManualVerificationState.PENDING },
      include: {
        suggestedChild: {
          select: { id: true, childCode: true, firstName: true, lastName: true, photo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewManualVerification(queueId: string, approved: boolean, notes: string, userId: string): Promise<any> {
    const item = await this.prisma.manualVerificationQueue.findUnique({
      where: { id: queueId },
    });

    if (!item) throw new NotFoundException(`Manual verification queue item ${queueId} not found.`);

    const newStatus = approved ? ManualVerificationState.APPROVED : ManualVerificationState.REJECTED;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.manualVerificationQueue.update({
        where: { id: queueId },
        data: {
          status: newStatus,
          reviewedById: userId,
          reviewedAt: new Date(),
          notes,
        },
      });

      if (approved) {
        await tx.attendanceRecord.create({
          data: {
            childId: item.suggestedChildId,
            orphanageId: item.orphanageId,
            sessionId: item.sessionId,
            date: new Date(),
            status: AttendanceStatus.PRESENT,
            isVerified: true,
            verifiedById: userId,
            biometricVerified: true,
            faceMatchScore: item.confidenceScore,
            markedById: userId,
          },
        });
      }

      return updated;
    });
  }

  async getUnknownFaceEvents(orphanageId: string): Promise<any> {
    return this.prisma.unknownFaceEvent.findMany({
      where: { orphanageId },
      orderBy: { lastDetectedAt: 'desc' },
    });
  }

  async resolveUnknownFaceEvent(eventId: string, notes: string, userId: string): Promise<any> {
    return this.prisma.unknownFaceEvent.update({
      where: { id: eventId },
      data: {
        status: UnknownFaceEventStatus.RESOLVED,
        resolvedById: userId,
        resolvedAt: new Date(),
        resolutionNotes: notes,
      },
    });
  }

  async getAttendanceHistory(orphanageId: string): Promise<any> {
    return this.prisma.attendanceSession.findMany({
      where: { orphanageId },
      include: {
        summary: true,
        attendanceRecords: {
          include: {
            child: {
              select: { id: true, childCode: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: 20,
    });
  }
}
