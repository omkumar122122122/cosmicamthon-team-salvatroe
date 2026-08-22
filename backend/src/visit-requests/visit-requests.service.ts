import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../common/enums/role.enum';
import { Prisma, VisitRequestStatus, RiskLevel, NotificationType, OrphanageStatus } from '@prisma/client';
import {
  CreateVisitRequestDto,
  QueryVisitRequestDto,
  ApproveVisitRequestDto,
  RejectVisitRequestDto,
  RescheduleVisitRequestDto,
  RequestDocumentsDto,
  CompleteVisitDto,
  CancelVisitRequestDto,
  RespondRescheduleDto,
  NoShowVisitDto,
  VisitRequestResponseDto,
  VisitRequestListResponseDto,
  VisitRequestListItemDto,
  VisitRequestSummaryDto,
  ParentBasicDto,
  OrphanageBasicDto,
  ChildBasicDto,
} from './dto';

@Injectable()
export class VisitRequestsService {
  private readonly logger = new Logger(VisitRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    dto: CreateVisitRequestDto,
    requestUserId: string,
  ): Promise<VisitRequestResponseDto> {
    // Get parent profile from user
    const parent = await this.prisma.parent.findUnique({
      where: { userId: requestUserId },
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
        policeVerification: {
          select: {
            status: true,
          },
        },
        documents: {
          select: {
            status: true,
            documentType: true,
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found. Please complete your profile first.');
    }

    // Check KYC status
    if (parent.kycStatus !== 'APPROVED') {
      throw new BadRequestException(
        'KYC verification must be completed before creating a visit request',
      );
    }

    // Validate orphanage exists and is available for parent visit requests
    const orphanage = await this.prisma.orphanage.findUnique({
      where: { id: dto.orphanageId },
    });

    if (!orphanage) {
      throw new NotFoundException(`Orphanage with ID ${dto.orphanageId} not found`);
    }

    if (
      !orphanage.isActive ||
      orphanage.deletedAt ||
      ([OrphanageStatus.INACTIVE, OrphanageStatus.SUSPENDED, OrphanageStatus.CLOSED] as OrphanageStatus[]).includes(orphanage.status)
    ) {
      throw new BadRequestException('Visit requests can only be created for approved active orphanages');
    }

    // Validate child if provided
    if (dto.childId) {
      const child = await this.prisma.child.findUnique({
        where: { id: dto.childId },
      });

      if (!child) {
        throw new NotFoundException(`Child with ID ${dto.childId} not found`);
      }

      if (child.orphanageId !== dto.orphanageId) {
        throw new BadRequestException('Child does not belong to the specified orphanage');
      }
    }

    this.validateVisitSlot(dto.visitDate, dto.visitTime, 'Visit date and time must be in the future');

    const duplicatePending = await this.prisma.visitRequest.findFirst({
      where: {
        parentId: parent.id,
        orphanageId: dto.orphanageId,
        status: VisitRequestStatus.PENDING,
      },
      select: {
        requestId: true,
      },
    });

    if (duplicatePending) {
      throw new BadRequestException(
        `You already have a pending visit request for this orphanage (${duplicatePending.requestId}).`,
      );
    }

    // Generate unique requestId
    const requestId = await this.generateRequestId();

    // Calculate risk level, face match, and trust scores from parent profile
    const trustScore = parent.trustScore || 85;
    const faceMatch = parent.kycStatus === 'APPROVED' ? 98.6 : 88.0;
    const riskLevel = this.calculateRiskLevel(parent);

    // Build verification object from parent data
    const verification = {
      kyc: parent.kycStatus === 'APPROVED' ? 'Verified' : 'Pending',
      police: parent.policeVerification?.status === 'CLEARED' ? 'Verified' : 'Pending',
      face: `${faceMatch}%`,
      background: parent.verificationStatus === 'APPROVED' ? 'Passed' : 'Pending',
      documents: parent.documents?.filter((d) => d.status === 'APPROVED').length > 0
        ? 'Verified'
        : 'Pending',
    };

    const behaviourPrediction = trustScore >= 75 ? 'Calm & Cooperative' : trustScore >= 50 ? 'Observant' : 'Supervision Required';

    // Create visit request
    const visitRequest = await this.prisma.visitRequest.create({
      data: {
        requestId,
        parentId: parent.id,
        orphanageId: dto.orphanageId,
        childId: dto.childId,
        visitDate: this.parseDateOnly(dto.visitDate),
        visitTime: dto.visitTime,
        purpose: dto.purpose,
        reason: dto.reason,
        adoptionTimeline: dto.adoptionTimeline,
        visitorsCount: dto.visitorsCount,
        relationshipOfVisitors: dto.relationshipOfVisitors,
        specialRequirements: dto.specialRequirements,
        familyBackground: dto.familyBackground,
        status: VisitRequestStatus.PENDING,
        riskLevel,
        trustScore,
        faceMatch,
        documentAuthenticity: parent.kycStatus === 'APPROVED' ? 'Verified' : 'Pending',
        behaviourPrediction,
        adoptionReadiness: this.calculateAdoptionReadiness(parent),
        recommendation: riskLevel === 'LOW' || riskLevel === 'VERY_LOW' ? 'Approve Visit' : 'Review Required',
        verification: verification as any,
        agreedToRules: dto.agreedToRules,
        uploadedDocuments: parent.documents?.filter((d) => d.status === 'APPROVED').map((d) => d.documentType) || [],
      },
      include: {
        parent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        orphanage: true,
        child: true,
      },
    });

    this.logger.log(
      `Visit request ${requestId} created by parent ${parent.id} for orphanage ${dto.orphanageId}`,
    );

    await this.notifyOrphanageStaffAboutNewRequest(
      dto.orphanageId,
      visitRequest.id,
      requestId,
      `${parent.user.firstName} ${parent.user.lastName}`.trim(),
    );

    return this.mapToResponseDto(visitRequest);
  }

  async findAll(
    queryDto: QueryVisitRequestDto,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<VisitRequestListResponseDto> {
    const {
      search,
      parentName,
      requestId,
      status,
      risk,
      riskLevel,
      visitDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const andConditions: Prisma.VisitRequestWhereInput[] = [];

    // Auto-scope for ORPHANAGE role
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      andConditions.push({ orphanageId: userOrphanageId });
    }

    // Search by parent name (ILIKE)
    const parentSearch = search || parentName;
    if (parentSearch) {
      andConditions.push({
        parent: {
          user: {
            OR: [
              { firstName: { contains: parentSearch, mode: 'insensitive' } },
              { lastName: { contains: parentSearch, mode: 'insensitive' } },
            ],
          },
        },
      });
    }

    // Search by request ID
    if (requestId) {
      andConditions.push({
        requestId: { contains: requestId, mode: Prisma.QueryMode.insensitive },
      });
    }

    // Filter by status
    if (status) {
      andConditions.push({ status: status as VisitRequestStatus });
    }

    // Filter by risk level
    const selectedRiskLevel = risk || riskLevel;
    if (selectedRiskLevel) {
      andConditions.push({ riskLevel: selectedRiskLevel as RiskLevel });
    }

    // Filter by visit date
    if (visitDate) {
      const date = new Date(visitDate);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      andConditions.push({
        visitDate: {
          gte: date,
          lt: nextDate,
        },
      });
    }

    const where: Prisma.VisitRequestWhereInput = {
      AND: andConditions.length > 0 ? andConditions : undefined,
    };

    const skip = (page - 1) * limit;
    const take = limit;

    console.log('[VisitRequestsService] Executing Prisma visitRequest.count()...');
    let total = 0;
    try {
      total = await this.prisma.visitRequest.count({ where });
      console.log('[VisitRequestsService] Prisma visitRequest.count() SUCCESS:', total);
    } catch (e: any) {
      console.error('[VisitRequestsService] Prisma visitRequest.count() FAILED:');
      console.error(e);
      console.error('Code:', e?.code);
      console.error('Meta:', e?.meta);
      console.error('Stack:', e?.stack);
      throw e;
    }

    // Build orderBy
    const orderBy: Prisma.VisitRequestOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    console.log('[VisitRequestsService] Executing Prisma visitRequest.findMany()...');
    let visitRequests: any[] = [];
    try {
      visitRequests = await this.prisma.visitRequest.findMany({
        where,
        include: {
          parent: {
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
              addresses: {
                where: { isPrimary: true },
                take: 1,
              },
              familyMembers: true,
            },
          },
          orphanage: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              phone: true,
              addressLine1: true,
              addressLine2: true,
            },
          },
          child: {
            select: {
              id: true,
              childCode: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              approximateAge: true,
              gender: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      });
      console.log('[VisitRequestsService] Prisma visitRequest.findMany() SUCCESS, fetched count:', visitRequests.length);
    } catch (e: any) {
      console.error('[VisitRequestsService] Prisma visitRequest.findMany() FAILED:');
      console.error(e);
      console.error('Code:', e?.code);
      console.error('Meta:', e?.meta);
      console.error('Stack:', e?.stack);
      throw e;
    }

    const data: VisitRequestListItemDto[] = visitRequests.map((vr) =>
      this.mapToListItemDto(vr),
    );

    console.log('[VisitRequestsService] Executing getSummaryStats()...');
    let summary: any;
    try {
      summary = await this.getSummaryStats(
        requestUserRole === Role.ORPHANAGE
          ? await this.getUserOrphanageId(requestUserId)
          : undefined,
      );
      console.log('[VisitRequestsService] getSummaryStats() SUCCESS');
    } catch (e: any) {
      console.error('[VisitRequestsService] getSummaryStats() FAILED:');
      console.error(e);
      console.error('Code:', e?.code);
      console.error('Meta:', e?.meta);
      console.error('Stack:', e?.stack);
      throw e;
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    };
  }

  async getStats(
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<VisitRequestSummaryDto> {
    const orphanageId =
      requestUserRole === Role.ORPHANAGE
        ? await this.getUserOrphanageId(requestUserId)
        : undefined;

    return this.getSummaryStats(orphanageId);
  }

  async findOne(
    id: string,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<VisitRequestResponseDto> {
    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id },
      include: {
        parent: {
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
            addresses: {
              where: { isPrimary: true },
              take: 1,
            },
            familyMembers: true,
          },
        },
        orphanage: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            phone: true,
            addressLine1: true,
            addressLine2: true,
          },
        },
        child: {
          select: {
            id: true,
            childCode: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            approximateAge: true,
            gender: true,
          },
        },
      },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${id} not found`);
    }

    // Validate access
    if (requestUserRole === Role.PARENT) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: requestUserId },
      });
      if (!parent || visitRequest.parentId !== parent.id) {
        throw new ForbiddenException('You can only view your own visit requests');
      }
    } else if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (visitRequest.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You can only view visit requests for your orphanage',
        );
      }
    }

    return this.mapToResponseDto(visitRequest);
  }

  async approve(
    id: string,
    dto: ApproveVisitRequestDto,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<VisitRequestResponseDto> {
    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${id} not found`);
    }

    if (visitRequest.status !== VisitRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve request with status ${visitRequest.status}`,
      );
    }

    // Validate access for ORPHANAGE role
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (visitRequest.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You can only approve visit requests for your orphanage',
        );
      }
    }

    const targetDate = dto.visitDate || visitRequest.visitDate.toISOString().split('T')[0];
    const targetTime = dto.visitTime || visitRequest.visitTime;
    this.validateVisitSlot(targetDate, targetTime, 'Approved visit date and time must be in the future');

    // Generate QR code if requested
    let qrCode = null;
    let qrStatus = 'Pending';
    if (dto.generateQr) {
      qrCode = await this.generateQRCode(id);
      qrStatus = 'Generated';
    }

    // Update visit request
    await this.prisma.visitRequest.update({
      where: { id },
      data: {
        status: VisitRequestStatus.APPROVED,
        visitDate: this.parseDateOnly(targetDate),
        visitTime: targetTime,
        visitorsCount: dto.visitorLimit ?? visitRequest.visitorsCount,
        expectedArrivalTime: targetTime,
        meetingRoom: dto.meetingRoom,
        assignedStaff: dto.assignedStaff,
        instructions: dto.instructions,
        qrCode,
        qrStatus,
        approvalNotes: dto.approvalNotes,
        reviewedById: requestUserId,
        reviewedAt: new Date(),
        parentNotified: dto.notifyParent || false,
        notifiedAt: dto.notifyParent ? new Date() : null,
      },
    });

    // Send notification to parent
    try {
      const parent = await this.prisma.parent.findUnique({
        where: { id: visitRequest.parentId },
        select: { userId: true },
      });

      const orphanage = await this.prisma.orphanage.findUnique({
        where: { id: visitRequest.orphanageId },
        select: { name: true },
      });

      if (parent && orphanage) {
        await this.notificationsService.sendNotification(
          parent.userId,
          NotificationType.VISIT_REQUEST_UPDATE,
          'Visit Request Approved',
          `Your visit request for ${orphanage.name} has been approved for ${new Date(dto.visitDate).toLocaleDateString()}.`,
          {
            relatedEntityType: 'VisitRequest',
            relatedEntityId: id,
          },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send notification for approved visit request ${id}:`, error);
      // Don't fail the entire operation if notification fails
    }

    this.logger.log(
      `Visit request ${id} approved by user ${requestUserId}`,
    );

    return this.findOne(id, requestUserId, requestUserRole);
  }

  async reject(
    id: string,
    dto: RejectVisitRequestDto,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<VisitRequestResponseDto> {
    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${id} not found`);
    }

    if (visitRequest.status !== VisitRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject request with status ${visitRequest.status}`,
      );
    }

    // Validate access for ORPHANAGE role
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (visitRequest.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You can only reject visit requests for your orphanage',
        );
      }
    }

    await this.prisma.visitRequest.update({
      where: { id },
      data: {
        status: VisitRequestStatus.REJECTED,
        rejectionReason: dto.reason,
        rejectionComments: dto.comments,
        reviewedById: requestUserId,
        reviewedAt: new Date(),
      },
    });

    // Send notification to parent
    try {
      const parent = await this.prisma.parent.findUnique({
        where: { id: visitRequest.parentId },
        select: { userId: true },
      });

      const orphanage = await this.prisma.orphanage.findUnique({
        where: { id: visitRequest.orphanageId },
        select: { name: true },
      });

      if (parent && orphanage) {
        await this.notificationsService.sendNotification(
          parent.userId,
          NotificationType.VISIT_REQUEST_UPDATE,
          'Visit Request Rejected',
          `Your visit request for ${orphanage.name} has been rejected. Reason: ${dto.reason}.`,
          {
            relatedEntityType: 'VisitRequest',
            relatedEntityId: id,
          },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send notification for rejected visit request ${id}:`, error);
      // Don't fail the entire operation if notification fails
    }

    this.logger.log(
      `Visit request ${id} rejected by user ${requestUserId}: ${dto.reason}`,
    );

    return this.findOne(id, requestUserId, requestUserRole);
  }

  async reschedule(
    id: string,
    dto: RescheduleVisitRequestDto,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<VisitRequestResponseDto> {
    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${id} not found`);
    }

    if (
      visitRequest.status !== VisitRequestStatus.PENDING &&
      visitRequest.status !== VisitRequestStatus.APPROVED &&
      visitRequest.status !== VisitRequestStatus.RESCHEDULED
    ) {
      throw new BadRequestException(
        `Cannot reschedule request with status ${visitRequest.status}`,
      );
    }

    // Validate access for ORPHANAGE role
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (visitRequest.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You can only reschedule visit requests for your orphanage',
        );
      }
    }

    // Validate new visit date is in future
    const newDate = new Date(dto.newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);

    if (newDate < today) {
      throw new BadRequestException('New visit date must be in the future');
    }

    // Store original date/time if first reschedule
    const originalVisitDate = visitRequest.originalVisitDate || visitRequest.visitDate;
    const originalVisitTime = visitRequest.originalVisitTime || visitRequest.visitTime;

    await this.prisma.visitRequest.update({
      where: { id },
      data: {
        status: VisitRequestStatus.RESCHEDULED,
        visitDate: this.parseDateOnly(dto.newDate),
        visitTime: dto.newTime,
        originalVisitDate,
        originalVisitTime,
        rescheduleReason: dto.reason,
        rescheduleCount: { increment: 1 },
        parentNotified: dto.notifyParent || false,
        notifiedAt: dto.notifyParent ? new Date() : null,
      },
    });

    // Send notification to parent
    try {
      const parent = await this.prisma.parent.findUnique({
        where: { id: visitRequest.parentId },
        select: { userId: true },
      });

      const orphanage = await this.prisma.orphanage.findUnique({
        where: { id: visitRequest.orphanageId },
        select: { name: true },
      });

      if (parent && orphanage) {
        await this.notificationsService.sendNotification(
          parent.userId,
          NotificationType.VISIT_REQUEST_UPDATE,
          'Visit Rescheduled',
          `Your visit to ${orphanage.name} has been rescheduled to ${new Date(dto.newDate).toLocaleDateString()}. Reason: ${dto.reason}.`,
          {
            relatedEntityType: 'VisitRequest',
            relatedEntityId: id,
          },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send notification for rescheduled visit request ${id}:`, error);
      // Don't fail the entire operation if notification fails
    }

    this.logger.log(
      `Visit request ${id} rescheduled by user ${requestUserId}: ${dto.reason}`,
    );

    return this.findOne(id, requestUserId, requestUserRole);
  }

  async requestDocuments(
    id: string,
    dto: RequestDocumentsDto,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<VisitRequestResponseDto> {
    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${id} not found`);
    }

    // Validate access for ORPHANAGE role
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (visitRequest.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You can only request documents for visit requests in your orphanage',
        );
      }
    }

    await this.prisma.visitRequest.update({
      where: { id },
      data: {
        missingDocuments: dto.missingDocuments,
        instructions: dto.note,
      },
    });

    this.logger.log(
      `Documents requested for visit request ${id} by user ${requestUserId}`,
    );

    return this.findOne(id, requestUserId, requestUserRole);
  }

  async complete(
    id: string,
    dto: CompleteVisitDto,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<VisitRequestResponseDto> {
    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${id} not found`);
    }

    if (visitRequest.status !== VisitRequestStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot complete request with status ${visitRequest.status}`,
      );
    }

    // Validate access for ORPHANAGE role
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (visitRequest.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You can only complete visit requests for your orphanage',
        );
      }
    }

    await this.prisma.visitRequest.update({
      where: { id },
      data: {
        status: VisitRequestStatus.COMPLETED,
        checkOutTime: new Date(dto.checkOutTime),
        postVisitFeedback: dto.postVisitFeedback as any,
        completedAt: new Date(),
        qrStatus: 'Completed',
        visitSupervisorId: requestUserId,
      },
    });

    this.logger.log(`Visit request ${id} completed by user ${requestUserId}`);

    return this.findOne(id, requestUserId, requestUserRole);
  }

  async checkIn(
    id: string,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<VisitRequestResponseDto> {
    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${id} not found`);
    }

    if (visitRequest.status !== VisitRequestStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot check in request with status ${visitRequest.status}`,
      );
    }

    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (visitRequest.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You can only check in visit requests for your orphanage',
        );
      }
    }

    await this.prisma.visitRequest.update({
      where: { id },
      data: {
        checkInTime: new Date(),
        qrStatus: 'Checked In',
      },
    });

    // Notify Parent
    try {
      const parent = await this.prisma.parent.findUnique({
        where: { id: visitRequest.parentId },
        select: { userId: true },
      });
      if (parent) {
        await this.notificationsService.sendNotification(
          parent.userId,
          NotificationType.VISIT_REQUEST_UPDATE,
          'Visit Check-In Confirmed',
          `Your visit check-in for request ${visitRequest.requestId} has been confirmed.`,
          { relatedEntityType: 'VisitRequest', relatedEntityId: id },
        );
      }
    } catch (error) {
      this.logger.error(`Notification failed for check-in ${id}:`, error);
    }

    this.logger.log(`Visit request ${id} checked in by user ${requestUserId}`);
    return this.findOne(id, requestUserId, requestUserRole);
  }

  async noShow(
    id: string,
    dto: NoShowVisitDto,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<VisitRequestResponseDto> {
    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${id} not found`);
    }

    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (visitRequest.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You can only update visit requests for your orphanage',
        );
      }
    }

    const reason = dto.reason || 'Parent did not arrive for scheduled visit slot';

    await this.prisma.visitRequest.update({
      where: { id },
      data: {
        status: VisitRequestStatus.CANCELLED,
        noShowReason: reason,
        qrStatus: 'No Show',
        parentNotified: true,
        notifiedAt: new Date(),
      },
    });

    // Notify Parent
    try {
      const parent = await this.prisma.parent.findUnique({
        where: { id: visitRequest.parentId },
        select: { userId: true },
      });
      if (parent) {
        await this.notificationsService.sendNotification(
          parent.userId,
          NotificationType.VISIT_REQUEST_UPDATE,
          'Visit Marked as No-Show',
          `Your visit request ${visitRequest.requestId} was marked as No-Show. Reason: ${reason}`,
          { relatedEntityType: 'VisitRequest', relatedEntityId: id },
        );
      }
    } catch (error) {
      this.logger.error(`Notification failed for no-show ${id}:`, error);
    }

    this.logger.log(`Visit request ${id} marked as no-show by user ${requestUserId}`);
    return this.findOne(id, requestUserId, requestUserRole);
  }

  async cancel(
    id: string,
    dto: CancelVisitRequestDto,
    requestUserId: string,
  ): Promise<VisitRequestResponseDto> {
    const parent = await this.prisma.parent.findUnique({
      where: { userId: requestUserId },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${id} not found`);
    }

    if (visitRequest.parentId !== parent.id) {
      throw new ForbiddenException('You can only cancel your own visit requests');
    }

    if (
      visitRequest.status === VisitRequestStatus.COMPLETED ||
      visitRequest.status === VisitRequestStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel request with status ${visitRequest.status}`,
      );
    }

    await this.prisma.visitRequest.update({
      where: { id },
      data: {
        status: VisitRequestStatus.CANCELLED,
        rejectionComments: dto.cancellationReason,
        parentNotified: true,
        notifiedAt: new Date(),
      },
    });

    try {
      const orphanage = await this.prisma.orphanage.findUnique({
        where: { id: visitRequest.orphanageId },
        select: { userId: true, name: true },
      });

      if (orphanage && orphanage.userId) {
        await this.notificationsService.sendNotification(
          orphanage.userId,
          NotificationType.VISIT_REQUEST_UPDATE,
          'Visit Request Cancelled',
          `Parent cancelled visit request ${visitRequest.requestId}. Reason: ${dto.cancellationReason || 'No reason provided'}.`,
          { relatedEntityType: 'VisitRequest', relatedEntityId: id },
        );
      }
    } catch (error) {
      this.logger.error(`Notification failed for cancelled visit ${id}:`, error);
    }

    this.logger.log(`Visit request ${id} cancelled by parent ${parent.id}`);

    return this.findOne(id, requestUserId, Role.PARENT);
  }

  async respondReschedule(
    id: string,
    dto: RespondRescheduleDto,
    requestUserId: string,
  ): Promise<VisitRequestResponseDto> {
    const parent = await this.prisma.parent.findUnique({
      where: { userId: requestUserId },
      select: { id: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${id} not found`);
    }

    if (visitRequest.parentId !== parent.id) {
      throw new ForbiddenException('You can only respond to your own visit requests');
    }

    if (visitRequest.status !== VisitRequestStatus.RESCHEDULED) {
      throw new BadRequestException(
        `Cannot respond to reschedule request with status ${visitRequest.status}`,
      );
    }

    if (dto.action === 'ACCEPT') {
      await this.prisma.visitRequest.update({
        where: { id },
        data: {
          status: VisitRequestStatus.APPROVED,
          approvalNotes: 'Reschedule proposal accepted by parent',
          parentNotified: true,
          notifiedAt: new Date(),
        },
      });

      try {
        const orphanage = await this.prisma.orphanage.findUnique({
          where: { id: visitRequest.orphanageId },
          select: { userId: true, name: true },
        });

        if (orphanage && orphanage.userId) {
          await this.notificationsService.sendNotification(
            orphanage.userId,
            NotificationType.VISIT_REQUEST_UPDATE,
            'Reschedule Accepted',
            `Parent accepted the proposed visit date for request ${visitRequest.requestId}.`,
            { relatedEntityType: 'VisitRequest', relatedEntityId: id },
          );
        }
      } catch (error) {
        this.logger.error(`Notification failed for accept reschedule ${id}:`, error);
      }

      this.logger.log(`Visit request ${id} reschedule accepted by parent ${parent.id}`);
    } else if (dto.action === 'REJECT') {
      if (!dto.reason || !dto.reason.trim()) {
        throw new BadRequestException('Reason is required when rejecting a reschedule request');
      }

      await this.prisma.visitRequest.update({
        where: { id },
        data: {
          status: VisitRequestStatus.REJECTED,
          rejectionReason: 'Reschedule Declined by Parent',
          rejectionComments: dto.reason,
          parentNotified: true,
          notifiedAt: new Date(),
        },
      });

      try {
        const orphanage = await this.prisma.orphanage.findUnique({
          where: { id: visitRequest.orphanageId },
          select: { userId: true, name: true },
        });

        if (orphanage && orphanage.userId) {
          await this.notificationsService.sendNotification(
            orphanage.userId,
            NotificationType.VISIT_REQUEST_UPDATE,
            'Reschedule Declined',
            `Parent declined the proposed visit date for request ${visitRequest.requestId}: ${dto.reason}`,
            { relatedEntityType: 'VisitRequest', relatedEntityId: id },
          );
        }
      } catch (error) {
        this.logger.error(`Notification failed for reject reschedule ${id}:`, error);
      }

      this.logger.log(`Visit request ${id} reschedule declined by parent ${parent.id}: ${dto.reason}`);
    } else {
      throw new BadRequestException('Invalid action. Must be ACCEPT or REJECT');
    }

    return this.findOne(id, requestUserId, Role.PARENT);
  }

  async getMyRequests(
    queryDto: QueryVisitRequestDto,
    requestUserId: string,
  ): Promise<VisitRequestListResponseDto> {
    const parent = await this.prisma.parent.findUnique({
      where: { userId: requestUserId },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;

    const where: Prisma.VisitRequestWhereInput = {
      parentId: parent.id,
      ...(status && { status: status as VisitRequestStatus }),
    };

    const skip = (page - 1) * limit;
    const total = await this.prisma.visitRequest.count({ where });

    const visitRequests = await this.prisma.visitRequest.findMany({
      where,
      include: {
        parent: {
          include: {
            user: true,
          },
        },
        orphanage: true,
        child: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const data: VisitRequestListItemDto[] = visitRequests.map((vr) =>
      this.mapToListItemDto(vr),
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: await this.getSummaryStats(undefined, parent.id),
    };
  }

  async getTodayVisits(
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<VisitRequestListItemDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Prisma.VisitRequestWhereInput = {
      visitDate: {
        gte: today,
        lt: tomorrow,
      },
      status: {
        in: [VisitRequestStatus.APPROVED, VisitRequestStatus.RESCHEDULED],
      },
    };

    // Auto-scope for ORPHANAGE role
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      where.orphanageId = userOrphanageId;
    }

    const visitRequests = await this.prisma.visitRequest.findMany({
      where,
      include: {
        parent: {
          include: {
            user: true,
          },
        },
        orphanage: true,
        child: true,
      },
      orderBy: {
        visitTime: 'asc',
      },
    });

    return visitRequests.map((vr) => this.mapToListItemDto(vr));
  }

  // Helper methods
  private async generateRequestId(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

    // Get count of requests this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const count = await this.prisma.visitRequest.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(2, '0');
    return `VR-${year}${month}${sequence}`;
  }

  private async generateQRCode(visitRequestId: string): Promise<string> {
    const payload = JSON.stringify({
      visitRequestId,
      system: 'ORPHANAGE_CHILD_SAFETY_SYSTEM',
      timestamp: new Date().toISOString(),
    });
    const base64Data = Buffer.from(payload).toString('base64');
    return `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#ffffff"/><path d="M20 20h50v50H20zM130 20h50v50h-50zM20 130h50v50H20z" fill="#0f172a"/><text x="100" y="105" font-size="10" text-anchor="middle" fill="#2563eb">${visitRequestId}</text></svg>`).toString('base64')}`;
  }

  private calculateRiskLevel(parent: any): RiskLevel {
    const trustScore = parent.trustScore || 0;

    if (trustScore >= 80) return RiskLevel.VERY_LOW;
    if (trustScore >= 60) return RiskLevel.LOW;
    if (trustScore >= 40) return RiskLevel.MEDIUM;
    if (trustScore >= 20) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  private calculateAdoptionReadiness(parent: any): string {
    const trustScore = parent.trustScore || 0;
    const kycApproved = parent.kycStatus === 'APPROVED';
    const verificationApproved = parent.verificationStatus === 'APPROVED';

    if (trustScore >= 80 && kycApproved && verificationApproved) {
      return 'High';
    } else if (trustScore >= 50 && kycApproved) {
      return 'Medium';
    }
    return 'Low';
  }

  private async getUserOrphanageId(userId: string): Promise<string> {
    // 1. Direct Orphanage account linkage
    const orphanage = await this.prisma.orphanage.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    if (orphanage) {
      return orphanage.id;
    }

    // 2. Orphanage Staff linkage
    const staff = await this.prisma.orphanageStaff.findFirst({
      where: {
        userId,
        isActive: true,
      },
      select: {
        orphanageId: true,
      },
    });

    if (staff && staff.orphanageId) {
      return staff.orphanageId;
    }

    throw new ForbiddenException(
      'User is not associated with any orphanage',
    );
  }

  private validateVisitSlot(dateValue: string, timeValue: string, message: string): void {
    const visitDateTime = new Date(`${dateValue}T${timeValue}:00`);

    if (Number.isNaN(visitDateTime.getTime())) {
      throw new BadRequestException('Invalid visit date or time');
    }

    if (visitDateTime <= new Date()) {
      throw new BadRequestException(message);
    }
  }

  private parseDateOnly(dateValue: string): Date {
    const [year, month, day] = dateValue.split('-').map((part) => Number(part));
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }

  private async notifyOrphanageStaffAboutNewRequest(
    orphanageId: string,
    visitRequestId: string,
    requestId: string,
    parentName: string,
  ): Promise<void> {
    try {
      const staff = await this.prisma.orphanageStaff.findMany({
        where: {
          orphanageId,
          isActive: true,
          user: {
            isActive: true,
            deletedAt: null,
          },
        },
        select: {
          userId: true,
        },
      });

      const staffUserIds = [...new Set(staff.map((item) => item.userId))];
      if (!staffUserIds.length) return;

      await this.notificationsService.sendBulkNotifications(
        staffUserIds,
        NotificationType.VISIT_REQUEST_UPDATE,
        'New Visit Request',
        `${parentName || 'A parent'} submitted visit request ${requestId}.`,
        {
          relatedEntityType: 'VisitRequest',
          relatedEntityId: visitRequestId,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to notify orphanage staff for visit request ${requestId}:`, error);
    }
  }

  private async getSummaryStats(
    orphanageId?: string,
    parentId?: string,
  ): Promise<VisitRequestSummaryDto> {
    const baseFilter: Prisma.VisitRequestWhereInput = {};

    if (orphanageId) {
      baseFilter.orphanageId = orphanageId;
    }

    if (parentId) {
      baseFilter.parentId = parentId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      pending,
      today_count,
      approved,
      rejected,
      completed,
      highRisk,
      rescheduled,
      cancelled,
    ] = await Promise.all([
      this.prisma.visitRequest.count({
        where: { ...baseFilter, status: VisitRequestStatus.PENDING },
      }),
      this.prisma.visitRequest.count({
        where: {
          ...baseFilter,
          visitDate: { gte: today, lt: tomorrow },
          status: {
            in: [VisitRequestStatus.APPROVED, VisitRequestStatus.RESCHEDULED],
          },
        },
      }),
      this.prisma.visitRequest.count({
        where: { ...baseFilter, status: VisitRequestStatus.APPROVED },
      }),
      this.prisma.visitRequest.count({
        where: { ...baseFilter, status: VisitRequestStatus.REJECTED },
      }),
      this.prisma.visitRequest.count({
        where: { ...baseFilter, status: VisitRequestStatus.COMPLETED },
      }),
      this.prisma.visitRequest.count({
        where: { ...baseFilter, riskLevel: { in: [RiskLevel.HIGH, RiskLevel.CRITICAL] } },
      }),
      this.prisma.visitRequest.count({
        where: { ...baseFilter, status: VisitRequestStatus.RESCHEDULED },
      }),
      this.prisma.visitRequest.count({
        where: { ...baseFilter, status: VisitRequestStatus.CANCELLED },
      }),
    ]);

    return {
      pending,
      today: today_count,
      approved,
      rejected,
      completed,
      highRisk,
      rescheduled,
      cancelled,
    };
  }

  private mapToResponseDto(visitRequest: any): VisitRequestResponseDto {
    const parent = visitRequest.parent;
    const user = parent?.user;
    const orphanage = visitRequest.orphanage;
    const child = visitRequest.child;

    // Calculate age from dateOfBirth
    const calculateAge = (dob: Date | null): number | undefined => {
      if (!dob) return undefined;
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    // Build parent data
    const primaryAddress = parent?.addresses?.[0];
    const parentDto: ParentBasicDto = {
      id: parent?.id,
      fullName: user ? `${user.firstName} ${user.lastName}` : '',
      age: parent?.dateOfBirth ? calculateAge(parent.dateOfBirth) : undefined,
      occupation: parent?.occupation,
      phone: user?.phone,
      email: user?.email,
      address: primaryAddress
        ? `${primaryAddress.addressLine1}, ${primaryAddress.city}, ${primaryAddress.state}`
        : undefined,
      familyMembers: parent?.familyMembers?.length
        ? `${parent.familyMembers.length} members`
        : undefined,
      income: parent?.incomeRange,
    };

    // Build orphanage data
    const orphanageDto: OrphanageBasicDto = {
      id: orphanage?.id,
      name: orphanage?.name,
      city: orphanage?.city,
      state: orphanage?.state,
      phone: orphanage?.phone,
      address: orphanage?.addressLine1
        ? `${orphanage.addressLine1}${orphanage.addressLine2 ? ', ' + orphanage.addressLine2 : ''}`
        : undefined,
    };

    // Build child data
    let childDto: ChildBasicDto | undefined;
    if (child) {
      childDto = {
        id: child.id,
        childCode: child.childCode,
        firstName: child.firstName,
        lastName: child.lastName,
        age: child.dateOfBirth
          ? calculateAge(child.dateOfBirth)
          : child.approximateAge,
        gender: child.gender,
      };
    }

    return {
      id: visitRequest.id,
      requestId: visitRequest.requestId,
      parentId: visitRequest.parentId,
      orphanageId: visitRequest.orphanageId,
      childId: visitRequest.childId,
      visitDate: visitRequest.visitDate,
      visitTime: visitRequest.visitTime,
      purpose: visitRequest.purpose,
      reason: visitRequest.reason,
      adoptionTimeline: visitRequest.adoptionTimeline,
      visitorsCount: visitRequest.visitorsCount,
      relationshipOfVisitors: visitRequest.relationshipOfVisitors,
      specialRequirements: visitRequest.specialRequirements,
      familyBackground: visitRequest.familyBackground,
      status: visitRequest.status,
      riskLevel: visitRequest.riskLevel,
      trustScore: visitRequest.trustScore,
      faceMatch: visitRequest.faceMatch,
      documentAuthenticity: visitRequest.documentAuthenticity,
      behaviourPrediction: visitRequest.behaviourPrediction,
      adoptionReadiness: visitRequest.adoptionReadiness,
      recommendation: visitRequest.recommendation,
      verification: visitRequest.verification,
      meetingRoom: visitRequest.meetingRoom,
      assignedStaff: visitRequest.assignedStaff,
      qrStatus: visitRequest.qrStatus,
      qrCode: visitRequest.qrCode,
      checkInTime: visitRequest.checkInTime,
      checkOutTime: visitRequest.checkOutTime,
      expectedArrivalTime: visitRequest.expectedArrivalTime,
      uploadedDocuments: visitRequest.uploadedDocuments,
      missingDocuments: visitRequest.missingDocuments,
      reviewedById: visitRequest.reviewedById,
      reviewedAt: visitRequest.reviewedAt,
      approvalNotes: visitRequest.approvalNotes,
      rejectionReason: visitRequest.rejectionReason,
      rejectionComments: visitRequest.rejectionComments,
      originalVisitDate: visitRequest.originalVisitDate,
      originalVisitTime: visitRequest.originalVisitTime,
      rescheduleReason: visitRequest.rescheduleReason,
      rescheduleCount: visitRequest.rescheduleCount,
      postVisitFeedback: visitRequest.postVisitFeedback,
      parentNotified: visitRequest.parentNotified,
      notifiedAt: visitRequest.notifiedAt,
      instructions: visitRequest.instructions,
      agreedToRules: visitRequest.agreedToRules,
      createdAt: visitRequest.createdAt,
      updatedAt: visitRequest.updatedAt,
      parent: parentDto,
      orphanage: orphanageDto,
      child: childDto,
    };
  }

  private mapToListItemDto(visitRequest: any): VisitRequestListItemDto {
    const responseDto = this.mapToResponseDto(visitRequest);
    return {
      id: responseDto.id,
      requestId: responseDto.requestId,
      parentId: responseDto.parentId,
      orphanageId: responseDto.orphanageId,
      childId: responseDto.childId,
      visitDate: responseDto.visitDate,
      visitTime: responseDto.visitTime,
      purpose: responseDto.purpose,
      status: responseDto.status,
      riskLevel: responseDto.riskLevel,
      trustScore: responseDto.trustScore,
      faceMatch: responseDto.faceMatch,
      createdAt: responseDto.createdAt,
      parent: responseDto.parent,
      orphanage: responseDto.orphanage,
      child: responseDto.child,
    };
  }
}
