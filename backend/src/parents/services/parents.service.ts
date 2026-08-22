import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  NotificationType,
  NotificationChannel,
  KycStatus,
  ParentVerificationStatus,
  DocumentStatus,
  AlertSeverity,
  AlertType,
  AlertStatus,
  Role,
  Prisma,
} from '@prisma/client';
import {
  CreateParentDto,
  UpdateParentDto,
  QueryParentDto,
  UpdateVerificationStatusDto,
  CreateAddressDto,
  CreateFamilyMemberDto,
  ReviewDocumentDto,
  ManualTrustScoreDto,
  SubmitKycDto,
  RequestDocumentUpdateDto,
  RequestReuploadDto,
} from '../dto';
import {
  ParentBasicDto,
  ParentProfileDto,
  PaginatedParentsResponseDto,
  ParentDashboardDto,
  KYCStatusDto,
  VerificationQueueResponseDto,
} from '../dto/parent-response.dto';
import { DocumentUploadService } from './document-upload.service';
import {
  REQUIRED_DOCUMENTS,
  TRUST_SCORE_MIN,
  TRUST_SCORE_MAX,
  TRUST_SCORE_DELTAS,
} from '../constants/parent.constants';
import { DocumentType } from '../enums/parent.enums';

@Injectable()
export class ParentsService {
  private readonly logger = new Logger(ParentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentUpload: DocumentUploadService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async create(userId: string, dto: CreateParentDto): Promise<{ id: string }> {
    const existingParent = await this.prisma.parent.findUnique({
      where: { userId },
    });

    if (existingParent) {
      throw new BadRequestException('Parent profile already exists for this user');
    }

    const parent = await this.prisma.parent.create({
      data: {
        userId,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender as any,
        nationality: dto.nationality,
        religion: dto.religion,
        maritalStatus: dto.maritalStatus,
        spouseName: dto.spouseName,
        spouseDateOfBirth: dto.spouseDateOfBirth ? new Date(dto.spouseDateOfBirth) : undefined,
        spouseOccupation: dto.spouseOccupation,
        alternatePhone: dto.alternatePhone,
        emergencyContact: dto.emergencyContact,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactRelation: dto.emergencyContactRelation,
        occupation: dto.occupation,
        employmentType: dto.employmentType,
        employerName: dto.employerName,
        employerAddress: dto.employerAddress,
        workPhone: dto.workPhone,
        yearsOfExperience: dto.yearsOfExperience,
        annualIncome: dto.annualIncome,
        incomeRange: dto.incomeRange,
        houseOwnership: dto.houseOwnership,
        numberOfRooms: dto.numberOfRooms,
        hasChildRoom: dto.hasChildRoom,
        hasChronicIllness: dto.hasChronicIllness,
        chronicIllnessDetails: dto.chronicIllnessDetails,
        hasDisability: dto.hasDisability,
        disabilityDetails: dto.disabilityDetails,
        hasHealthInsurance: dto.hasHealthInsurance,
        preferredChildAge: dto.preferredChildAge,
        preferredGender: dto.preferredGender as any,
        preferredCount: dto.preferredCount,
        openToSpecialNeeds: dto.openToSpecialNeeds,
        specialNeedsDetails: dto.specialNeedsDetails,
        adoptionMotivation: dto.adoptionMotivation,
        hasAdoptedBefore: dto.hasAdoptedBefore,
        previousAdoptionDetails: dto.previousAdoptionDetails,
        trustScore: 0,
        isProfileComplete: this.calculateProfileCompletion(dto) >= 80,
      },
    });

    this.logger.log(`Parent profile created: ${parent.id}`);
    return { id: parent.id };
  }

  async findAll(
    queryDto: QueryParentDto,
    userRole: Role,
    userId?: string,
  ): Promise<PaginatedParentsResponseDto> {
    const {
      page = 1,
      limit = 20,
      search,
      verificationStatus,
      kycApproved,
      isActive,
      minTrustScore,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const where: Prisma.ParentWhereInput = {
      deletedAt: null,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    if (kycApproved !== undefined) {
      where.kycStatus = kycApproved ? KycStatus.APPROVED : { not: KycStatus.APPROVED };
    }

    if (minTrustScore !== undefined) {
      where.trustScore = { gte: minTrustScore };
    }

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { occupation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [parents, total] = await Promise.all([
      this.prisma.parent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.parent.count({ where }),
    ]);

    const data: ParentBasicDto[] = parents.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: `${p.user.firstName} ${p.user.lastName}`,
      email: p.user.email,
      phone: p.user.phone || '',
      verificationStatus: p.verificationStatus,
      trustScore: p.trustScore,
      kycStatus: p.kycStatus,
      registeredAt: p.createdAt,
    }));

    const summary = {
      pending: await this.prisma.parent.count({ where: { ...where, verificationStatus: 'PENDING' as any } }),
      verified: await this.prisma.parent.count({ where: { ...where, verificationStatus: 'APPROVED' as any } }),
      rejected: await this.prisma.parent.count({ where: { ...where, verificationStatus: 'REJECTED' as any } }),
      highRisk: await this.prisma.parent.count({ where: { ...where, trustScore: { lt: 60 } } }),
    };

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    };
  }

  async findOne(id: string, userId: string, userRole: Role): Promise<ParentProfileDto> {
    const parent = await this.prisma.parent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        addresses: true,
        documents: {
          select: {
            id: true,
            documentType: true,
            status: true,
            fileName: true,
            storageUrl: true,
            createdAt: true,
          },
        },
        familyMembers: true,
        policeVerification: true,
      },
    });

    if (!parent || parent.deletedAt) {
      throw new NotFoundException('Parent not found');
    }

    if (userRole === Role.PARENT && parent.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      id: parent.id,
      userId: parent.userId,
      firstName: parent.user.firstName,
      lastName: parent.user.lastName,
      email: parent.user.email,
      phone: parent.user.phone || '',
      dateOfBirth: parent.dateOfBirth ?? undefined,
      gender: parent.gender ?? undefined,
      nationality: parent.nationality,
      maritalStatus: parent.maritalStatus ?? undefined,
      occupation: parent.occupation ?? undefined,
      annualIncome: parent.annualIncome ?? undefined,
      houseOwnership: parent.houseOwnership ?? undefined,
      verificationStatus: parent.verificationStatus,
      trustScore: parent.trustScore,
      kycStatus: parent.kycStatus,
      verificationNotes: parent.verificationNotes ?? undefined,
      addresses: parent.addresses,
      documents: parent.documents,
      familyMembers: parent.familyMembers,
      policeVerification: parent.policeVerification,
      isActive: parent.isActive,
      createdAt: parent.createdAt,
      updatedAt: parent.updatedAt,
    };
  }

  async update(id: string, dto: UpdateParentDto, userId: string, userRole: Role): Promise<void> {
    const parent = await this.prisma.parent.findUnique({ where: { id } });

    if (!parent || parent.deletedAt) {
      throw new NotFoundException('Parent not found');
    }

    if (userRole === Role.PARENT && parent.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.parent.update({
      where: { id },
      data: {
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender as any,
        nationality: dto.nationality,
        religion: dto.religion,
        maritalStatus: dto.maritalStatus,
        spouseName: dto.spouseName,
        occupation: dto.occupation,
        employmentType: dto.employmentType,
        annualIncome: dto.annualIncome,
        incomeRange: dto.incomeRange,
        houseOwnership: dto.houseOwnership,
        numberOfRooms: dto.numberOfRooms,
        hasChildRoom: dto.hasChildRoom,
        adoptionMotivation: dto.adoptionMotivation,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Parent updated: ${id}`);
  }

  async remove(id: string): Promise<void> {
    const parent = await this.prisma.parent.findUnique({ where: { id } });

    if (!parent || parent.deletedAt) {
      throw new NotFoundException('Parent not found');
    }

    await this.prisma.parent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    this.logger.log(`Parent soft deleted: ${id}`);
  }

  async updateVerificationStatus(
    id: string,
    dto: UpdateVerificationStatusDto,
    adminId: string,
  ): Promise<void> {
    const parent = await this.prisma.parent.findUnique({ where: { id } });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    await this.prisma.parent.update({
      where: { id },
      data: {
        verificationStatus: dto.status as any,
        verificationNotes: dto.verificationNotes,
        rejectionReason: dto.rejectionReason,
        interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : undefined,
        interviewNotes: dto.interviewNotes,
        verifiedById: dto.status === 'APPROVED' ? adminId : undefined,
        verifiedAt: dto.status === 'APPROVED' ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Parent verification status updated: ${id} -> ${dto.status}`);
  }

  async getDashboard(userId: string): Promise<ParentDashboardDto> {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        documents: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        adoptionRecords: {
          include: {
            child: {
              select: {
                id: true,
                childCode: true,
                firstName: true,
                lastName: true,
                approximateAge: true,
                dateOfBirth: true,
                healthStatus: true,
                orphanage: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    const adoptionRecord = parent.adoptionRecords[0];
    const child = adoptionRecord?.child;
    const completedVisits = await this.prisma.visitRequest.count({
      where: { parentId: parent.id, status: 'COMPLETED' },
    });

    let linkedChild: any = undefined;
    if (child) {
      const age = child.dateOfBirth
        ? Math.floor((Date.now() - child.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : child.approximateAge || 0;

      linkedChild = {
        id: child.id,
        childCode: child.childCode,
        name: `${child.firstName} ${child.lastName || ''}`.trim(),
        age,
        orphanageName: child.orphanage?.name || 'Unknown',
        healthStatus: child.healthStatus,
      };
    }

    const adoptionJourney = {
      currentStep: this.calculateAdoptionStep(parent),
      totalSteps: 5,
      steps: [
        { name: 'KYC Submitted', completed: parent.kycStatus !== 'PENDING' },
        { name: 'Identity Verified', completed: parent.verificationStatus === 'APPROVED' },
        { name: 'Visit Completed', completed: completedVisits > 0, isCurrent: completedVisits === 0 && parent.verificationStatus === 'APPROVED' },
        { name: 'Legal Review', completed: adoptionRecord?.status === 'COMPLETED', isCurrent: ['LEGAL_PROCESS', 'UNDER_REVIEW', 'MATCHED'].includes(adoptionRecord?.status || '') },
        { name: 'Adoption Complete', completed: adoptionRecord?.status === 'COMPLETED' },
      ],
    };

    return {
      parent: {
        id: parent.id,
        firstName: parent.user.firstName,
        lastName: parent.user.lastName,
        email: parent.user.email,
      },
      verification: {
        kycStatus: parent.kycStatus,
        trustScore: parent.trustScore,
        verificationStatus: parent.verificationStatus,
      },
      linkedChild,
      adoptionJourney,
    };
  }

  async getKycStatus(userId: string): Promise<KYCStatusDto> {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        verifiedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        documents: {
          select: {
            id: true,
            documentType: true,
            status: true,
            fileName: true,
            originalName: true,
            storageUrl: true,
            createdAt: true,
            reviewedAt: true,
            rejectionReason: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        adoptionRecords: {
          include: {
            child: {
              select: {
                id: true,
                childCode: true,
                firstName: true,
                lastName: true,
                approximateAge: true,
                dateOfBirth: true,
              },
            },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    const approvedTypes = new Set(
      parent.documents
        .filter((d) => d.status === 'APPROVED' || d.status === 'UPLOADED' || d.status === 'UNDER_REVIEW')
        .map((d) => d.documentType),
    );
    const missingDocuments = REQUIRED_DOCUMENTS.filter((doc) => !approvedTypes.has(doc as any));

    const adoption = parent.adoptionRecords[0];
    const child = adoption?.child;
    let childAge = 0;
    if (child?.dateOfBirth) {
      childAge = Math.floor(
        (Date.now() - child.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );
    } else if (child?.approximateAge) {
      childAge = child.approximateAge;
    }

    const yearsUntil16 = childAge > 0 ? Math.max(0, 16 - childAge) : 16;
    const isOneTimeVerified = parent.kycStatus === 'APPROVED';
    const canEditDocuments = parent.kycStatus === 'PENDING' || parent.kycStatus === 'RE_UPLOAD_REQUIRED';

    let complianceStatus = 'Draft / Pending';
    if (parent.kycStatus === 'APPROVED') {
      complianceStatus = 'Compliant';
    } else if (parent.kycStatus === 'SUBMITTED' || parent.kycStatus === 'UNDER_REVIEW') {
      complianceStatus = 'Under Review';
    } else if (parent.kycStatus === 'RE_UPLOAD_REQUIRED') {
      complianceStatus = 'Re-upload Required';
    } else if (parent.kycStatus === 'REJECTED') {
      complianceStatus = 'Rejected';
    }

    const parentName = `${parent.user.firstName} ${parent.user.lastName}`.trim();
    const parentAvatar = `${parent.user.firstName?.[0] || ''}${parent.user.lastName?.[0] || ''}`.toUpperCase();

    // Fetch submissions history if available
    let submissions: any[] = [];
    try {
      if ((this.prisma as any).kycSubmission) {
        submissions = await (this.prisma as any).kycSubmission.findMany({
          where: { parentId: parent.id },
          orderBy: { createdAt: 'desc' },
          include: { reviewedBy: { select: { firstName: true, lastName: true } } },
        });
      }
    } catch {
      submissions = [];
    }

    const verificationHistory = submissions.length > 0
      ? submissions.map((sub, idx) => {
          const isLatest = idx === 0;
          const effectiveStatus = (parent.kycStatus === 'APPROVED' && (isLatest || sub.status === 'APPROVED'))
            ? 'APPROVED'
            : (parent.kycStatus === 'REJECTED' && isLatest)
            ? 'REJECTED'
            : sub.status;

          return {
            id: sub.id,
            attemptNumber: sub.attemptNumber,
            type: `KYC Submission Package (Attempt #${sub.attemptNumber})`,
            status: effectiveStatus,
            date: sub.reviewedAt || sub.submittedAt || sub.createdAt,
            reviewedBy: sub.reviewedBy
              ? `${sub.reviewedBy.firstName} ${sub.reviewedBy.lastName}`
              : parent.verifiedBy
              ? `${parent.verifiedBy.firstName} ${parent.verifiedBy.lastName}`
              : undefined,
            notes:
              sub.rejectionReason ||
              sub.notes ||
              (effectiveStatus === 'APPROVED'
                ? 'Verification Granted & Approved by Administrator'
                : effectiveStatus === 'REJECTED'
                ? parent.kycRejectionReason || parent.rejectionReason || 'Verification Rejected'
                : 'Package submitted for admin review'),
          };
        })
      : parent.documents
        .filter((doc) => doc.status === 'APPROVED' || doc.status === 'REJECTED')
        .map((doc) => ({
          id: doc.id,
          type: doc.documentType,
          status: doc.status,
          fileName: doc.originalName || doc.fileName,
          date: doc.reviewedAt || doc.createdAt,
          notes: doc.rejectionReason || 'Document reviewed',
        }));

    return {
      parentId: parent.id,
      parentName,
      parentAvatar,
      email: parent.user.email,
      contactNumber: parent.user.phone || parent.alternatePhone || undefined,
      kycStatus: parent.kycStatus,
      isOneTimeVerified,
      canEditDocuments,
      lastKycDate: parent.kycSubmittedAt ?? undefined,
      kycApprovedAt: parent.kycApprovedAt ?? undefined,
      kycRejectionReason: parent.kycRejectionReason ?? parent.rejectionReason ?? undefined,
      complianceStatus,
      childId: child?.id,
      childName: child
        ? `${child.firstName} ${child.lastName || ''}`.trim()
        : undefined,
      childAge: child ? childAge : undefined,
      adoptionDate: adoption?.completedDate ?? adoption?.createdAt ?? undefined,
      yearsUntil16,
      trustScore: parent.trustScore,
      verificationStatus: parent.verificationStatus,
      verificationHistory,
      documents: parent.documents,
      requiredDocuments: [...REQUIRED_DOCUMENTS],
      missingDocuments: missingDocuments as string[],
    };
  }

  async submitKyc(userId: string, dto: SubmitKycDto = {}): Promise<{ message: string; kycStatus: string }> {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        documents: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!parent || parent.deletedAt) {
      throw new NotFoundException('Parent profile not found');
    }

    if (parent.kycStatus === 'APPROVED') {
      throw new BadRequestException('KYC is already approved. One-time verification complete.');
    }

    if (parent.kycStatus === 'SUBMITTED' || parent.kycStatus === 'UNDER_REVIEW') {
      throw new BadRequestException('KYC is currently under review.');
    }

    const uploadedTypes = new Set(parent.documents.map((d) => d.documentType));
    const missing = REQUIRED_DOCUMENTS.filter((doc) => !uploadedTypes.has(doc as any));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required documents: ${missing.join(', ')}. Upload all required documents before submitting KYC.`,
      );
    }

    let submissionId: string | undefined;
    try {
      if ((this.prisma as any).kycSubmission) {
        const attemptCount = await (this.prisma as any).kycSubmission.count({
          where: { parentId: parent.id },
        });

        const submission = await (this.prisma as any).kycSubmission.create({
          data: {
            parentId: parent.id,
            status: KycStatus.SUBMITTED,
            submittedAt: new Date(),
            attemptNumber: attemptCount + 1,
            notes: dto.notes,
          },
        });
        submissionId = submission.id;

        await this.prisma.parentDocument.updateMany({
          where: { parentId: parent.id },
          data: {
            submissionId: submission.id,
            status: DocumentStatus.UNDER_REVIEW,
          },
        });
      } else {
        await this.prisma.parentDocument.updateMany({
          where: { parentId: parent.id },
          data: {
            status: DocumentStatus.UNDER_REVIEW,
          },
        });
      }
    } catch (subErr) {
      this.logger.warn(`Could not record KycSubmission entry: ${subErr?.message || subErr}`);
      await this.prisma.parentDocument.updateMany({
        where: { parentId: parent.id },
        data: {
          status: DocumentStatus.UNDER_REVIEW,
        },
      });
    }

    await this.prisma.parent.update({
      where: { id: parent.id },
      data: {
        kycStatus: KycStatus.SUBMITTED,
        kycSubmittedAt: new Date(),
        verificationStatus:
          parent.verificationStatus === ParentVerificationStatus.PENDING
            ? ParentVerificationStatus.UNDER_REVIEW
            : parent.verificationStatus,
        verificationNotes: dto.notes
          ? [parent.verificationNotes, dto.notes].filter(Boolean).join('\n')
          : parent.verificationNotes,
        updatedAt: new Date(),
      },
    });

    // Send notification to all admins about new KYC submission
    try {
      const adminUsers = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        const parentName = `${parent.user.firstName} ${parent.user.lastName}`.trim();
        await this.notificationsService.sendBulkNotifications(
          adminUsers.map((admin) => admin.id),
          NotificationType.KYC_STATUS_CHANGED,
          'New KYC Submitted',
          `${parentName} has submitted KYC documents for verification. Please review the submission.`,
          {
            relatedEntityType: 'PARENT',
            relatedEntityId: parent.id,
          },
        );
        this.logger.log(`KYC submission notification sent to ${adminUsers.length} admin(s) for parent ${parent.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send KYC submission notification for parent ${parent.id}:`, error);
    }

    this.logger.log(`KYC submitted for parent: ${parent.id} (Submission ID: ${submissionId || 'N/A'})`);
    return { message: 'KYC submitted successfully for review', kycStatus: 'SUBMITTED', submissionId: submissionId || parent.id } as any;
  }

  async requestDocumentUpdate(userId: string, dto: RequestDocumentUpdateDto): Promise<{ message: string }> {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!parent || parent.deletedAt) {
      throw new NotFoundException('Parent profile not found');
    }

    if (parent.kycStatus !== 'APPROVED') {
      throw new BadRequestException('Document update requests can only be submitted for approved KYC profiles.');
    }

    await this.prisma.parent.update({
      where: { id: parent.id },
      data: {
        kycUpdateReason: dto.reason || 'Document update requested by parent.',
        updatedAt: new Date(),
      },
    });

    try {
      const adminUsers = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        const parentName = `${parent.user.firstName} ${parent.user.lastName}`.trim();
        await this.notificationsService.sendBulkNotifications(
          adminUsers.map((admin) => admin.id),
          NotificationType.KYC_STATUS_CHANGED,
          'Document Update Requested',
          `${parentName} has requested a document update. Reason: ${dto.reason || 'Not specified'}.`,
          {
            relatedEntityType: 'PARENT',
            relatedEntityId: parent.id,
          },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to notify admins of document update request for parent ${parent.id}:`, error);
    }

    return { message: 'Document update request submitted successfully. An administrator will review your request.' };
  }

  async uploadDocument(
    parentId: string,
    documentType: string,
    file: Express.Multer.File,
    userId: string,
    userRole: Role,
    documentNumber?: string,
  ) {
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent || parent.deletedAt) {
      throw new NotFoundException('Parent not found');
    }
    if (userRole === Role.PARENT && parent.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (userRole === Role.PARENT && parent.kycStatus === 'APPROVED') {
      throw new ForbiddenException(
        'KYC is already approved. Documents cannot be modified directly. Please submit a Document Update Request.',
      );
    }

    if (!Object.values(DocumentType).includes(documentType as DocumentType)) {
      throw new BadRequestException(`Invalid document type: ${documentType}`);
    }

    // Check if a document of this type already exists for the parent
    const existingDocument = await this.prisma.parentDocument.findFirst({
      where: { parentId, documentType: documentType as any },
    });

    if (existingDocument) {
      // Delete old file from Cloudinary
      if (existingDocument.storagePath || existingDocument.storageUrl) {
        await this.documentUpload.deleteFile(
          existingDocument.storagePath || existingDocument.storageUrl!,
        );
      }
      // Delete existing document record from DB
      await this.prisma.parentDocument.delete({
        where: { id: existingDocument.id },
      });
      this.logger.log(
        `Old document (${existingDocument.id}) of type ${documentType} deleted from Cloudinary and DB for parent ${parentId}`,
      );
    }

    const saved = await this.documentUpload.saveFile(file, parentId);

    const document = await this.prisma.parentDocument.create({
      data: {
        parentId,
        documentType: documentType as any,
        status: 'UPLOADED' as any,
        fileName: saved.fileName,
        originalName: saved.originalName,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        storagePath: saved.storagePath,
        storageUrl: saved.storageUrl,
        documentNumber,
        isRequired: REQUIRED_DOCUMENTS.includes(documentType as DocumentType),
      },
    });

    this.logger.log(`Document uploaded for parent ${parentId}: ${document.id}`);
    return document;
  }

  async uploadBatchDocuments(
    parentId: string,
    files: Express.Multer.File[],
    documentTypes: string[],
    userId: string,
    userRole: Role,
  ) {
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent || parent.deletedAt) {
      throw new NotFoundException('Parent not found');
    }
    if (userRole === Role.PARENT && parent.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (userRole === Role.PARENT && parent.kycStatus === 'APPROVED') {
      throw new ForbiddenException(
        'KYC is already approved. Documents cannot be modified directly. Please submit a Document Update Request.',
      );
    }

    const uploadedDocs = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docType = documentTypes[i] || documentTypes[0];
      if (!docType || !Object.values(DocumentType).includes(docType as DocumentType)) {
        throw new BadRequestException(`Invalid or missing document type for file ${file.originalname}`);
      }

      const existingDocument = await this.prisma.parentDocument.findFirst({
        where: { parentId, documentType: docType as any },
      });
      if (existingDocument) {
        if (existingDocument.storagePath || existingDocument.storageUrl) {
          await this.documentUpload.deleteFile(
            existingDocument.storagePath || existingDocument.storageUrl!,
          );
        }
        await this.prisma.parentDocument.delete({
          where: { id: existingDocument.id },
        });
      }

      const saved = await this.documentUpload.saveFile(file, parentId);

      const document = await this.prisma.parentDocument.create({
        data: {
          parentId,
          documentType: docType as any,
          status: 'UPLOADED' as any,
          fileName: saved.fileName,
          originalName: saved.originalName,
          mimeType: saved.mimeType,
          fileSize: saved.fileSize,
          storagePath: saved.storagePath,
          storageUrl: saved.storageUrl,
          isRequired: REQUIRED_DOCUMENTS.includes(docType as DocumentType),
        },
      });
      uploadedDocs.push(document);
    }

    this.logger.log(`${uploadedDocs.length} document(s) batch uploaded for parent ${parentId}`);
    return uploadedDocs;
  }

  async reviewDocument(
    parentId: string,
    documentId: string,
    dto: ReviewDocumentDto,
    adminId: string,
  ) {
    const document = await this.prisma.parentDocument.findFirst({
      where: { id: documentId, parentId },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (dto.status === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting a document');
    }

    const updated = await this.prisma.parentDocument.update({
      where: { id: documentId },
      data: {
        status: dto.status as any,
        rejectionReason: dto.rejectionReason,
        reviewNotes: dto.reviewNotes,
        documentNumber: dto.documentNumber,
        issuedBy: dto.issuedBy,
        issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    // Adjust trust score on document review
    const delta =
      dto.status === 'APPROVED'
        ? TRUST_SCORE_DELTAS.DOCUMENT_APPROVED
        : dto.status === 'REJECTED'
          ? TRUST_SCORE_DELTAS.DOCUMENT_REJECTED
          : 0;
    if (delta !== 0) {
      await this.applyTrustScoreDelta(parentId, delta, `Document ${dto.status}: ${document.documentType}`, adminId);
    }

    return updated;
  }

  async addAddress(parentId: string, dto: CreateAddressDto, userId: string, userRole: Role) {
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent || parent.deletedAt) throw new NotFoundException('Parent not found');
    if (userRole === Role.PARENT && parent.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (dto.isPrimary) {
      await this.prisma.parentAddress.updateMany({
        where: { parentId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.parentAddress.create({
      data: {
        parentId,
        type: dto.type as any,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        landmark: dto.landmark,
        city: dto.city,
        district: dto.district,
        state: dto.state,
        pincode: dto.pincode,
        country: dto.country || 'India',
        isPrimary: dto.isPrimary ?? false,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  async addFamilyMember(
    parentId: string,
    dto: CreateFamilyMemberDto,
    userId: string,
    userRole: Role,
  ) {
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent || parent.deletedAt) throw new NotFoundException('Parent not found');
    if (userRole === Role.PARENT && parent.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.familyMember.create({
      data: {
        parentId,
        name: dto.name,
        relationship: dto.relationship as any,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender as any,
        occupation: dto.occupation,
        annualIncome: dto.annualIncome,
        isDependent: dto.isDependent ?? false,
        contactPhone: dto.contactPhone,
        aadhaarNumber: (dto as any).aadharNumber || (dto as any).aadhaarNumber,
        notes: dto.notes,
      },
    });
  }

  async updateTrustScore(parentId: string, dto: ManualTrustScoreDto, adminId: string) {
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent || parent.deletedAt) throw new NotFoundException('Parent not found');

    return this.applyTrustScoreDelta(parentId, dto.delta, dto.reason, adminId);
  }

  private async applyTrustScoreDelta(
    parentId: string,
    delta: number,
    reason: string,
    actorId: string,
  ) {
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent not found');

    const previous = parent.trustScore;
    const next = Math.min(TRUST_SCORE_MAX, Math.max(TRUST_SCORE_MIN, previous + delta));

    await this.prisma.$transaction(async (tx) => {
      await tx.parent.update({
        where: { id: parentId },
        data: {
          trustScore: next,
          lastTrustScoreUpdate: new Date(),
        },
      });

      // TrustScoreLog may exist — write if model is available
      try {
        await (tx as any).trustScoreLog?.create?.({
          data: {
            parentId,
            previousScore: previous,
            newScore: next,
            delta,
            reason,
            changedById: actorId,
          },
        });
      } catch {
        // Model optional — ignore if not present
      }
    });

    this.logger.log(`Trust score updated for ${parentId}: ${previous} -> ${next} (${reason})`);
    return { parentId, previousScore: previous, newScore: next, delta, reason };
  }


  async getVerificationQueue(queryDto: QueryParentDto): Promise<VerificationQueueResponseDto> {
    const {
      page = 1,
      limit = 50,
      search,
      verificationStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const where: Prisma.ParentWhereInput = {
      deletedAt: null,
    };

    if (verificationStatus && (verificationStatus as string) !== 'ALL') {
      where.verificationStatus = verificationStatus as any;
    }

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
        { user: { lastName: { contains: search, mode: 'insensitive' as const } } },
        { user: { email: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [parents, total] = await Promise.all([
      this.prisma.parent.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          documents: {
            orderBy: { createdAt: 'desc' },
          },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.parent.count({ where }),
    ]);

    const data = parents.map((p) => ({
      id: p.id,
      name: `${p.user.firstName} ${p.user.lastName}`.trim(),
      email: p.user.email,
      phone: p.user.phone || '',
      registeredAt: p.createdAt,
      verificationStatus: p.verificationStatus,
      kycStatus: p.kycStatus,
      kycSubmittedAt: p.kycSubmittedAt ?? undefined,
      kycApprovedAt: p.kycApprovedAt ?? undefined,
      kycRejectionReason: p.kycRejectionReason ?? p.rejectionReason ?? undefined,
      rejectionReason: p.rejectionReason ?? p.kycRejectionReason ?? undefined,
      trustScore: p.trustScore,
      occupation: p.occupation ?? undefined,
      annualIncome: p.annualIncome ?? undefined,
      documents: p.documents || [],
      documentsCount: p.documents?.length || 0,
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      pending: await this.prisma.parent.count({ where: { verificationStatus: 'PENDING' as any, deletedAt: null } }),
      verified: await this.prisma.parent.count({ where: { verificationStatus: 'APPROVED' as any, deletedAt: null } }),
      rejected: await this.prisma.parent.count({ where: { verificationStatus: 'REJECTED' as any, deletedAt: null } }),
      highRisk: await this.prisma.parent.count({ where: { trustScore: { lt: 60 }, deletedAt: null } }),
      openIssues: 0,
      today: await this.prisma.parent.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
    };

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    };
  }

  async approveParent(id: string, adminId: string): Promise<void> {
    const parent = await this.prisma.parent.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    if (parent.verificationStatus === 'APPROVED') {
      throw new BadRequestException('Parent already approved');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.parent.update({
        where: { id },
        data: {
          verificationStatus: ParentVerificationStatus.APPROVED,
          kycStatus: KycStatus.APPROVED,
          kycApprovedAt: new Date(),
          verifiedById: adminId,
          verifiedAt: new Date(),
          isActive: true,
          updatedAt: new Date(),
        },
      });

      await tx.parentDocument.updateMany({
        where: { parentId: id },
        data: {
          status: DocumentStatus.APPROVED,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });

      try {
        if ((tx as any).kycSubmission) {
          await (tx as any).kycSubmission.updateMany({
            where: { parentId: id },
            data: {
              status: 'APPROVED',
              reviewedById: adminId,
              reviewedAt: new Date(),
            },
          });
        }
      } catch {}

      if (parent.user.role !== Role.PARENT) {
        await tx.user.update({
          where: { id: parent.userId },
          data: { role: Role.PARENT },
        });
      }
    });

    const parentName = `${parent.user.firstName} ${parent.user.lastName}`.trim();

    // Send notification to the parent
    try {
      await this.notificationsService.sendNotification(
        parent.userId,
        NotificationType.KYC_STATUS_CHANGED,
        'KYC Approved',
        `Your KYC verification has been approved. You can now access all parent features and submit visit requests to orphanages.`,
        {
          relatedEntityType: 'PARENT',
          relatedEntityId: parent.id,
        },
      );
      this.logger.log(`Approval notification sent to parent ${parent.id}`);
    } catch (error) {
      this.logger.error(`Failed to send approval notification to parent ${parent.id}:`, error);
    }

    // Send notification to all admins about successful verification
    try {
      const adminUsers = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        await this.notificationsService.sendBulkNotifications(
          adminUsers.map((admin) => admin.id),
          NotificationType.KYC_STATUS_CHANGED,
          'Parent Verified',
          `${parentName} has been successfully verified and approved. KYC status updated to APPROVED.`,
          {
            relatedEntityType: 'PARENT',
            relatedEntityId: parent.id,
          },
        );
        this.logger.log(`Parent approval notification sent to ${adminUsers.length} admin(s) for parent ${parent.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send admin notification for parent approval ${parent.id}:`, error);
    }

    this.logger.log(`Parent approved: ${id}`);
  }


  async rejectParent(id: string, reason: string, adminId: string): Promise<void> {
    const parent = await this.prisma.parent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const parentName = `${parent.user.firstName} ${parent.user.lastName}`.trim();

    await this.prisma.$transaction(async (tx) => {
      // Update parent status
      await tx.parent.update({
        where: { id },
        data: {
          verificationStatus: ParentVerificationStatus.REJECTED,
          kycStatus: KycStatus.REJECTED,
          rejectionReason: reason,
          kycRejectionReason: reason,
          verifiedById: adminId,
          updatedAt: new Date(),
        },
      });

      await tx.parentDocument.updateMany({
        where: { parentId: id },
        data: {
          status: DocumentStatus.REJECTED,
          rejectionReason: reason,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });

      try {
        if ((tx as any).kycSubmission) {
          await (tx as any).kycSubmission.updateMany({
            where: { parentId: id, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'PENDING'] } },
            data: {
              status: 'REJECTED',
              rejectionReason: reason,
              reviewedById: adminId,
              reviewedAt: new Date(),
            },
          });
        }
      } catch {}

      // Create HIGH severity alert for KYC rejection
      await tx.alert.create({
        data: {
          severity: AlertSeverity.HIGH,
          type: AlertType.KYC_VERIFICATION_FAILED,
          status: AlertStatus.OPEN,
          title: 'KYC Verification Rejected',
          details: `Parent ${parentName} (${parent.user.email}) KYC verification was rejected. Reason: ${reason}`,
          parentId: parent.id,
          createdById: adminId,
          isAutoGenerated: false,
          sourceService: 'ParentsService',
          metadata: {
            parentId: parent.id,
            parentName,
            parentEmail: parent.user.email,
            rejectionReason: reason,
            rejectedBy: adminId,
            rejectedAt: new Date().toISOString(),
          },
        },
      });
    });

    // Send notification to the parent
    try {
      await this.notificationsService.sendNotification(
        parent.userId,
        NotificationType.KYC_STATUS_CHANGED,
        'KYC Rejected',
        `Your KYC verification has been rejected. Reason: ${reason}. Please update your documents and resubmit or contact support for assistance.`,
        {
          relatedEntityType: 'PARENT',
          relatedEntityId: parent.id,
        },
      );
      this.logger.log(`Rejection notification sent to parent ${parent.id}`);
    } catch (error) {
      this.logger.error(`Failed to send rejection notification to parent ${parent.id}:`, error);
    }

    // Send notification to all admins about KYC rejection
    try {
      const adminUsers = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        await this.notificationsService.sendBulkNotifications(
          adminUsers.map((admin) => admin.id),
          NotificationType.KYC_STATUS_CHANGED,
          'KYC Verification Failed',
          `KYC verification failed for ${parentName}. Reason: ${reason}. A high-priority alert has been created.`,
          {
            relatedEntityType: 'PARENT',
            relatedEntityId: parent.id,
          },
        );
        this.logger.log(`KYC rejection notification sent to ${adminUsers.length} admin(s) for parent ${parent.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send admin notification for parent rejection ${parent.id}:`, error);
    }

    this.logger.log(`Parent rejected: ${id} | Reason: ${reason} | Alert created`);
  }

  async requestReupload(id: string, dto: RequestReuploadDto, adminId: string): Promise<void> {
    const parent = await this.prisma.parent.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        documents: true,
      },
    });

    if (!parent || parent.deletedAt) {
      throw new NotFoundException('Parent not found');
    }

    const reason = dto.reason || 'Requested document re-upload for verification.';

    await this.prisma.$transaction(async (tx) => {
      // Update parent status
      await tx.parent.update({
        where: { id },
        data: {
          kycStatus: KycStatus.RE_UPLOAD_REQUIRED,
          verificationStatus: ParentVerificationStatus.DOCUMENTS_REQUIRED,
          rejectionReason: reason,
          kycRejectionReason: reason,
          verifiedById: adminId,
          updatedAt: new Date(),
        },
      });

      // If specific document types were indicated, flag them as REJECTED in ParentDocument
      if (dto.documentTypes && dto.documentTypes.length > 0) {
        await tx.parentDocument.updateMany({
          where: {
            parentId: id,
            documentType: { in: dto.documentTypes as DocumentType[] },
          },
          data: {
            status: DocumentStatus.REJECTED,
            rejectionReason: reason,
            reviewedById: adminId,
            reviewedAt: new Date(),
          },
        });
      }
    });

    // Send notification to parent
    try {
      await this.notificationsService.sendNotification(
        parent.userId,
        NotificationType.KYC_STATUS_CHANGED,
        'Document Re-upload Requested',
        `An administrator has requested you to re-upload your verification documents. Remarks: ${reason}`,
        {
          relatedEntityType: 'PARENT',
          relatedEntityId: parent.id,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send re-upload notification to parent ${id}:`, error);
    }

    this.logger.log(`Document re-upload requested for parent ${id} by admin ${adminId}`);
  }

  private calculateProfileCompletion(dto: CreateParentDto): number {
    const requiredFields = [
      'dateOfBirth',
      'gender',
      'nationality',
      'occupation',
      'annualIncome',
      'houseOwnership',
      'numberOfRooms',
      'adoptionMotivation',
    ];

    const filledFields = requiredFields.filter((field) => {
      const key = field as keyof CreateParentDto;
      return dto[key] != null;
    });
    return Math.round((filledFields.length / requiredFields.length) * 100);
  }

  private calculateAdoptionStep(parent: any): number {
    if (parent.adoptionRecords?.[0]?.status === 'COMPLETED') return 5;
    if (parent.verificationStatus === 'APPROVED') return 2;
    if (parent.kycStatus !== 'PENDING') return 1;
    return 0;
  }
}