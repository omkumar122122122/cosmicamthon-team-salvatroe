import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RegisterChildDto } from '../dto/register-child.dto';
import { RegisterChildResponseDto, RegisteredChildDataDto } from '../dto/register-child-response.dto';
import { ChildrenRepository } from '../repositories/children.repository';
import { ChildRegistrationValidator } from '../validators/child-registration.validator';
import { ChildMedicalService } from '../medical/child-medical.service';
import { ChildAdmissionService } from '../admission/child-admission.service';
import { ChildDocumentsService } from '../documents/child-documents.service';
import { ChildAttendanceProfileService } from '../attendance/child-attendance-profile.service';
import { ChildFaceEnrollmentService } from '../face-enrollment/child-face-enrollment.service';
import { ChildRegistrationNotificationService } from '../notifications/child-registration-notification.service';
import { ChildIdGeneratorUtil } from '../utils/child-id-generator.util';
import { ChildRegistrationStatus } from '../enums/child-registration-status.enum';
import { Role, ChildGender, BloodGroup } from '@prisma/client';

@Injectable()
export class ChildrenRegistrationService {
  private readonly logger = new Logger(ChildrenRegistrationService.name);

  constructor(
    private readonly childrenRepository: ChildrenRepository,
    private readonly validator: ChildRegistrationValidator,
    private readonly medicalService: ChildMedicalService,
    private readonly admissionService: ChildAdmissionService,
    private readonly documentsService: ChildDocumentsService,
    private readonly attendanceProfileService: ChildAttendanceProfileService,
    private readonly faceEnrollmentService: ChildFaceEnrollmentService,
    private readonly notificationService: ChildRegistrationNotificationService
  ) {}

  /**
   * Registers a new child with full transactional integrity, attendance initialization,
   * audit logging, and admin notification.
   */
  async registerChild(
    dto: RegisterChildDto,
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RegisterChildResponseDto> {
    // 1. Resolve Orphanage ID based on User Role
    let targetOrphanageId = dto.orphanageId;

    if (userRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.childrenRepository.findOrphanageIdForUser(userId);
      if (!userOrphanageId) {
        throw new ForbiddenException('Orphanage staff user is not associated with an active orphanage.');
      }
      targetOrphanageId = userOrphanageId;
    }

    if (!targetOrphanageId) {
      throw new BadRequestException('Orphanage ID must be specified for child registration.');
    }

    // 2. Validate Registration DTO & Check Duplicates
    await this.validator.validateRegistration(dto, targetOrphanageId);

    // 3. Generate Unique Child ID Code
    const childCode = ChildIdGeneratorUtil.generateChildCode();

    // 4. Resolve Orphanage Name
    const orphanageName = await this.childrenRepository.findOrphanageName(targetOrphanageId);

    // 5. Prepare Sub-Module Payloads
    const medicalData = this.medicalService.prepareMedicalData(dto);
    const admissionData = this.admissionService.prepareAdmissionData(dto, targetOrphanageId);
    const aiEnrollmentStatus = this.faceEnrollmentService.getInitialEnrollmentStatus();

    // Calculate age from DOB if DOB provided, else use approximateAge
    let age = dto.approximateAge || 0;
    let dobDate: Date | null = null;
    if (dto.dateOfBirth) {
      dobDate = new Date(dto.dateOfBirth);
      const today = new Date();
      let calculatedYears = today.getFullYear() - dobDate.getFullYear();
      if (
        today.getMonth() < dobDate.getMonth() ||
        (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate())
      ) {
        calculatedYears--;
      }
      age = Math.max(0, calculatedYears);
    }

    // 6. Execute Prisma Transaction
    const newChild = await this.childrenRepository.createChildWithTransaction(async (prismaTx) => {
      // 6a. Create Child Master Record
      const createdChild = await prismaTx.child.create({
        data: {
          childCode,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName ? dto.lastName.trim() : null,
          dateOfBirth: dobDate,
          approximateAge: age,
          gender: dto.gender || ChildGender.UNKNOWN,
          bloodGroup: dto.bloodGroup || BloodGroup.UNKNOWN,
          motherTongue: dto.motherTongue || null,
          nationality: dto.nationality || 'Indian',
          distinguishingMarks: dto.distinguishingMarks || null,
          aadhaarNumber: dto.aadhaarNumber || null,
          birthCertNumber: dto.birthCertNumber || null,
          photo: dto.photo || null,
          currentStatus: 'REGISTERED',
          isActive: true,
          ...medicalData,
          ...admissionData,
        },
      });

      // 6b. Initialize Attendance Profile Capability
      await this.attendanceProfileService.initializeAttendanceProfile(prismaTx, createdChild.id);

      // 6c. Create Initial Medical History Record if applicable
      await this.medicalService.createInitialMedicalRecord(prismaTx, createdChild.id, dto, userId);

      // 6d. Save Emergency Contact / Guardian History
      await this.documentsService.saveEmergencyContact(prismaTx, createdChild.id, dto, userId);

      return createdChild;
    });

    const fullName = `${newChild.firstName} ${newChild.lastName || ''}`.trim();
    const attendanceProfile = this.attendanceProfileService.getDefaultAttendanceProfile();

    // 7. Audit Log Recording
    await this.childrenRepository.createAuditLog({
      userId,
      action: 'CHILD_REGISTERED',
      resource: 'Child',
      resourceId: newChild.id,
      details: {
        childCode: newChild.childCode,
        fullName,
        orphanageId: targetOrphanageId,
        orphanageName,
        registrationStatus: ChildRegistrationStatus.REGISTERED,
        aiEnrollmentStatus,
      },
      ipAddress,
      userAgent,
    });

    // 8. Trigger Admin Notification asynchronously
    this.notificationService.notifyAdminsOnRegistration({
      childName: fullName,
      childCode: newChild.childCode,
      orphanageName,
      childId: newChild.id,
    });

    // 9. Format Structured Response DTO
    const childDataDto: RegisteredChildDataDto = {
      id: newChild.id,
      childCode: newChild.childCode,
      firstName: newChild.firstName,
      lastName: newChild.lastName || '',
      fullName,
      approximateAge: newChild.approximateAge || age,
      registrationStatus: ChildRegistrationStatus.REGISTERED,
      aiEnrollmentStatus,
      registrationTimestamp: newChild.createdAt.toISOString(),
      orphanageName,
      attendanceProfile,
    };

    this.logger.log(`Child registered successfully: ${fullName} (${newChild.childCode}) at ${orphanageName}`);

    return {
      statusCode: 201,
      message: 'Child registered successfully',
      data: childDataDto,
    };
  }
}
