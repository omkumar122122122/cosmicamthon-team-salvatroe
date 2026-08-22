import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChildrenRepository } from '../repositories/children.repository';
import { FaceQualityValidatorService } from './services/face-quality-validator.service';
import { FaceEmbeddingGeneratorService } from './services/face-embedding-generator.service';
import { DuplicateFaceDetectorService } from './services/duplicate-face-detector.service';
import { ProfilePictureSelectorService } from './services/profile-picture-selector.service';
import { ChildRegistrationNotificationService } from '../notifications/child-registration-notification.service';
import {
  StartEnrollmentResponseDto,
} from './dto/start-enrollment.dto';
import { ProcessFrameDto, ProcessFrameResponseDto } from './dto/process-frame.dto';
import { CompleteEnrollmentDto, CompleteEnrollmentResponseDto } from './dto/complete-enrollment.dto';
import { FacialPoseType } from './interfaces/face-quality.interface';
import { AiEnrollmentStatus } from '../enums/ai-enrollment-status.enum';

@Injectable()
export class ChildFaceEnrollmentService {
  private readonly logger = new Logger(ChildFaceEnrollmentService.name);

  private readonly REQUIRED_POSES: FacialPoseType[] = [
    FacialPoseType.FRONT_NEUTRAL,
    FacialPoseType.FRONT_SMILING,
    FacialPoseType.LEFT_PROFILE,
    FacialPoseType.RIGHT_PROFILE,
    FacialPoseType.LOOK_UP,
    FacialPoseType.LOOK_DOWN,
    FacialPoseType.BLINK_LIVENESS,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly childrenRepository: ChildrenRepository,
    private readonly qualityValidator: FaceQualityValidatorService,
    private readonly embeddingGenerator: FaceEmbeddingGeneratorService,
    private readonly duplicateDetector: DuplicateFaceDetectorService,
    private readonly profilePictureSelector: ProfilePictureSelectorService,
    private readonly notificationService: ChildRegistrationNotificationService
  ) {}

  getInitialEnrollmentStatus(): AiEnrollmentStatus {
    return AiEnrollmentStatus.PENDING;
  }

  isEligibleForEnrollment(approximateAge?: number): boolean {
    return approximateAge !== undefined && approximateAge >= 0;
  }

  /**
   * Initializes a live camera AI Face Enrollment session for a child.
   */
  async startEnrollment(childId: string): Promise<StartEnrollmentResponseDto> {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, childCode: true, firstName: true, lastName: true },
    });

    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found.`);
    }

    this.logger.log(`Initialized AI Face Enrollment session for child ${child.childCode}`);

    return {
      statusCode: 200,
      message: 'AI Face Enrollment session initialized',
      requiredPoses: this.REQUIRED_POSES,
      childCode: child.childCode,
    };
  }

  /**
   * Processes & validates a single live camera frame for quality and pose alignment.
   */
  processFrame(dto: ProcessFrameDto): ProcessFrameResponseDto {
    const validationResult = this.qualityValidator.validateFrame(
      dto.imageBase64,
      dto.pose,
      {
        lightingQuality: dto.lightingQuality,
        blurScore: dto.blurScore,
      }
    );

    return {
      isValid: validationResult.isValid,
      qualityScore: validationResult.qualityScore,
      pose: dto.pose,
      errors: validationResult.errors,
    };
  }

  /**
   * Completes the multi-pose AI Face Enrollment pipeline:
   * 1. Validates all required poses captured
   * 2. Generates 512-d encrypted face embedding vector
   * 3. Performs duplicate face detection across all enrolled database records
   * 4. Selects best smiling front-facing profile picture
   * 5. Executes Prisma transaction saving BiometricData and updating Child status to "Completed"
   * 6. Writes Audit Log & sends Admin Notification
   */
  async completeEnrollment(
    dto: CompleteEnrollmentDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<CompleteEnrollmentResponseDto> {
    console.log('[FaceEnrollmentService] === ENTERING SERVICE ===');
    console.log('[FaceEnrollmentService] DTO childId:', dto?.childId);
    console.log('[FaceEnrollmentService] Captured frames count:', dto?.capturedFrames?.length);
    console.log('[FaceEnrollmentService] User ID:', userId);

    const { childId, capturedFrames } = dto;

    // 1. Fetch Child Record (by ID or childCode)
    console.log('[FaceEnrollmentService] [DB Step 1] Querying Child by ID or Code:', childId);
    let child: any;
    try {
      child = await this.prisma.child.findFirst({
        where: {
          OR: [
            { id: childId },
            { childCode: childId }
          ],
          deletedAt: null,
        },
        select: {
          id: true,
          childCode: true,
          firstName: true,
          lastName: true,
          orphanageId: true,
        },
      });
      console.log('[FaceEnrollmentService] [DB Step 1 SUCCESS] Found child:', child ? `id=${child.id}, code=${child.childCode}` : 'NULL');
    } catch (error: any) {
      console.error('[FaceEnrollmentService] [DB Step 1 FAILED] Error querying Child:', error);
      console.error('Error code:', error?.code);
      console.error('Error meta:', error?.meta);
      console.error('Stack:', error?.stack);
      throw error;
    }

    if (!child) {
      console.error(`[FaceEnrollmentService] Child with ID or Code '${childId}' not found in database.`);
      throw new NotFoundException(`Child with ID or Code '${childId}' not found.`);
    }

    const realChildUuid = child.id;
    const childName = `${child.firstName} ${child.lastName || ''}`.trim();

    // 2. Validate all 7 required poses are captured
    const capturedPoses = new Set(capturedFrames.map((f) => f.pose));
    console.log('[FaceEnrollmentService] Captured poses:', Array.from(capturedPoses));
    const missingPoses = this.REQUIRED_POSES.filter((pose) => !capturedPoses.has(pose));

    if (missingPoses.length > 0) {
      console.warn('[FaceEnrollmentService] Missing poses:', missingPoses);
      throw new BadRequestException(
        `Enrollment incomplete. Missing required facial poses: ${missingPoses.join(', ')}`
      );
    }

    // 3. Generate 512-d Encrypted Biometric Embedding Vector
    console.log('[FaceEnrollmentService] Generating 512-d embedding vector...');
    const embeddingData = this.embeddingGenerator.generateEmbedding(realChildUuid, capturedFrames.length);
    console.log('[FaceEnrollmentService] Embedding generated successfully. Model:', embeddingData?.modelVersion);

    // 4. Duplicate Face Check against Database Enrolled Biometrics
    try {
      console.log('[FaceEnrollmentService] [DB Step 2] Checking for duplicate face embeddings...');
      await this.duplicateDetector.checkForDuplicateChild(realChildUuid, embeddingData.vector);
      console.log('[FaceEnrollmentService] [DB Step 2 SUCCESS] Duplicate check passed');
    } catch (error: any) {
      console.error('[FaceEnrollmentService] [DB Step 2 FAILED] Duplicate face check error:', error);
      console.error('Error code:', error?.code);
      console.error('Error meta:', error?.meta);
      console.error('Stack:', error?.stack);
      
      try {
        await this.childrenRepository.createAuditLog({
          userId,
          action: 'AI_FACE_ENROLLMENT_FAILED',
          resource: 'Child',
          resourceId: realChildUuid,
          details: {
            reason: 'Duplicate Face Detected',
            error: error?.message,
          },
          ipAddress,
          userAgent,
        });
      } catch (auditErr) {
        console.error('[FaceEnrollmentService] Audit log write failed:', auditErr);
      }

      throw error;
    }

    // 5. Select Best Profile Picture (Prefers FRONT_SMILING)
    const bestProfile = this.profilePictureSelector.selectBestProfileImage(capturedFrames);

    // Calculate Overall Enrollment Quality Score
    const totalQuality = capturedFrames.reduce((sum, f) => {
      const v = this.qualityValidator.validateFrame(f.imageBase64, f.pose, {
        lightingQuality: f.lightingQuality,
        blurScore: f.blurScore,
      });
      return sum + v.qualityScore;
    }, 0);
    const averageQualityScore = Math.round(totalQuality / capturedFrames.length);

    // Verify if userId exists in database to avoid foreign key failure on capturedBy
    let validCapturedBy: string | null = null;
    if (userId) {
      try {
        const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (u) validCapturedBy = u.id;
      } catch (uErr) {
        console.warn('[FaceEnrollmentService] User lookup for capturedBy notice:', uErr);
      }
    }

    // 6. Execute Prisma Transaction
    console.log('[FaceEnrollmentService] [DB Step 3] Starting Prisma Transaction...');
    try {
      await this.prisma.$transaction(async (prismaTx) => {
        // 6a. Upsert BiometricData record using real master embedding
        console.log('[FaceEnrollmentService] [Tx Sub-Step 3a] Processing BiometricData for child UUID:', realChildUuid);
        try {
          const existingBio = await prismaTx.biometricData.findFirst({
            where: {
              childId: realChildUuid,
              type: 'FACE_RECOGNITION',
            },
            orderBy: { createdAt: 'desc' },
          });

          let finalEncodingJson: string = embeddingData.encryptedJson;
          if (dto.masterEmbedding && Array.isArray(dto.masterEmbedding) && dto.masterEmbedding.length === 512) {
            finalEncodingJson = JSON.stringify(dto.masterEmbedding);
            console.log('[FaceEnrollmentService] Using real masterEmbedding passed in DTO (length: 512)');
          } else if (existingBio && existingBio.faceEncodingJson) {
            finalEncodingJson = existingBio.faceEncodingJson;
            console.log('[FaceEnrollmentService] Retaining existing real faceEncodingJson from Phase 6C');
          }

          if (existingBio) {
            await prismaTx.biometricData.update({
              where: { id: existingBio.id },
              data: {
                faceEncodingJson: finalEncodingJson,
                faceImageUrl: bestProfile.bestImageUrl,
                faceModelVersion: embeddingData.modelVersion,
                quality: averageQualityScore,
                isActive: true,
                notes: `Enrolled with ${capturedFrames.length} poses. Checksum: ${embeddingData.checksum.substring(0, 16)}`,
              },
            });
            console.log('[FaceEnrollmentService] [Tx Sub-Step 3a SUCCESS] BiometricData updated, ID:', existingBio.id);
          } else {
            const bioRecord = await prismaTx.biometricData.create({
              data: {
                childId: realChildUuid,
                type: 'FACE_RECOGNITION',
                capturedAt: new Date(),
                capturedBy: validCapturedBy,
                faceEncodingJson: finalEncodingJson,
                faceImageUrl: bestProfile.bestImageUrl,
                faceModelVersion: embeddingData.modelVersion,
                quality: averageQualityScore,
                isActive: true,
                notes: `Enrolled with ${capturedFrames.length} poses. Checksum: ${embeddingData.checksum.substring(0, 16)}`,
              },
            });
            console.log('[FaceEnrollmentService] [Tx Sub-Step 3a SUCCESS] BiometricData created, ID:', bioRecord.id);
          }
        } catch (subErr: any) {
          console.error('[FaceEnrollmentService] [Tx Sub-Step 3a FAILED] BiometricData save error:', subErr);
          console.error('Error code:', subErr?.code);
          console.error('Error meta:', subErr?.meta);
          console.error('Stack:', subErr?.stack);
          throw subErr;
        }

        // 6b. Update Child Entity Flags
        console.log('[FaceEnrollmentService] [Tx Sub-Step 3b] Updating Child entity UUID:', realChildUuid);
        try {
          await prismaTx.child.update({
            where: { id: realChildUuid },
            data: {
              photo: bestProfile.bestImageUrl,
              currentStatus: 'REGISTERED',
            },
          });
          console.log('[FaceEnrollmentService] [Tx Sub-Step 3b SUCCESS] Child updated successfully');
        } catch (subErr: any) {
          console.error('[FaceEnrollmentService] [Tx Sub-Step 3b FAILED] Child.update error:', subErr);
          console.error('Error code:', subErr?.code);
          console.error('Error meta:', subErr?.meta);
          console.error('Stack:', subErr?.stack);
          throw subErr;
        }

        // 6c. Enable face recognition flag on orphanage if assigned
        if (child.orphanageId) {
          console.log('[FaceEnrollmentService] [Tx Sub-Step 3c] Updating Orphanage ID:', child.orphanageId);
          try {
            await prismaTx.orphanage.update({
              where: { id: child.orphanageId },
              data: {
                faceRecognitionEnabled: true,
                biometricAttendanceEnabled: true,
              },
            });
            console.log('[FaceEnrollmentService] [Tx Sub-Step 3c SUCCESS] Orphanage updated successfully');
          } catch (subErr: any) {
            console.error('[FaceEnrollmentService] [Tx Sub-Step 3c FAILED] Orphanage.update error:', subErr);
            console.error('Error code:', subErr?.code);
            console.error('Error meta:', subErr?.meta);
            console.error('Stack:', subErr?.stack);
            throw subErr;
          }
        }
      });
      console.log('[FaceEnrollmentService] [DB Step 3 SUCCESS] Prisma Transaction COMMITTED');
    } catch (txErr: any) {
      console.error('[FaceEnrollmentService] [DB Step 3 FAILED] Prisma Transaction ROLLED BACK:', txErr);
      console.error('Error message:', txErr?.message);
      console.error('Error code:', txErr?.code);
      console.error('Error meta:', txErr?.meta);
      console.error('Stack:', txErr?.stack);
      throw txErr;
    }

    // 7. Audit Log Recording
    console.log('[FaceEnrollmentService] [DB Step 4] Writing Audit Log...');
    try {
      await this.childrenRepository.createAuditLog({
        userId: validCapturedBy || userId,
        action: 'AI_FACE_ENROLLMENT_COMPLETED',
        resource: 'Child',
        resourceId: realChildUuid,
        details: {
          childCode: child.childCode,
          fullName: childName,
          qualityScore: averageQualityScore,
          modelVersion: embeddingData.modelVersion,
          posesCapturedCount: capturedFrames.length,
          selectedProfilePose: bestProfile.selectedPose,
        },
        ipAddress,
        userAgent,
      });
      console.log('[FaceEnrollmentService] [DB Step 4 SUCCESS] Audit Log recorded');
    } catch (auditErr: any) {
      console.error('[FaceEnrollmentService] [DB Step 4 NOTICE] Audit Log error (non-fatal):', auditErr?.message);
    }

    // 8. Trigger Admin Success Notification
    const orphanageName = child.orphanageId
      ? await this.childrenRepository.findOrphanageName(child.orphanageId)
      : 'Care Center';

    try {
      this.notificationService.notifyAdminsOnRegistration({
        childName: `${childName} (AI Enrollment Completed)`,
        childCode: child.childCode,
        orphanageName,
        childId: child.id,
      });
    } catch (notifErr: any) {
      console.warn('[FaceEnrollmentService] Admin notification notice:', notifErr?.message);
    }

    console.log('[FaceEnrollmentService] === EXITING SERVICE SUCCESS ===');

    this.logger.log(
      `AI Face Enrollment completed successfully for child ${childName} (${child.childCode}) with quality score ${averageQualityScore}%`
    );

    return {
      statusCode: 200,
      message: 'AI Face Enrollment completed successfully. Child is now AI Attendance Ready.',
      aiEnrollmentStatus: 'Completed',
      attendanceReady: true,
      faceVerified: true,
      enrollmentQualityScore: averageQualityScore,
      profileImageUrl: bestProfile.bestImageUrl,
    };
  }
}
