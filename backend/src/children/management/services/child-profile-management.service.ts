import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChildrenRepository } from '../../repositories/children.repository';
import { UpdateChildProfileDto } from '../dto/update-child-profile.dto';
import { ChildStatus, ChildDocumentType } from '@prisma/client';

@Injectable()
export class ChildProfileManagementService {
  private readonly logger = new Logger(ChildProfileManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: ChildrenRepository,
  ) {}

  /**
   * Retrieves full detailed child profile including orphanage, biometric status, medical history, documents & attendance
   */
  async getChildProfile(childId: string) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        orphanage: {
          select: {
            id: true,
            code: true,
            name: true,
            city: true,
            state: true,
          },
        },
        biometricData: {
          where: { isActive: true },
          select: {
            id: true,
            type: true,
            capturedAt: true,
            quality: true,
            faceImageUrl: true,
            faceModelVersion: true,
          },
        },
        medicalHistories: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        attendanceRecords: {
          orderBy: { date: 'desc' },
          take: 7,
        },
        healthReports: {
          orderBy: { reportDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found.`);
    }

    const isEnrolled = child.biometricData.some((b) => b.type === 'FACE_RECOGNITION');
    const smilingBio = child.biometricData.find((b: any) => b.faceImageUrl);
    const resolvedPhoto = child.photo || smilingBio?.faceImageUrl || null;

    return {
      ...child,
      photo: resolvedPhoto,
      fullName: `${child.firstName} ${child.lastName || ''}`.trim(),
      aiEnrollmentStatus: isEnrolled ? 'Completed' : 'Pending',
      faceVerified: isEnrolled,
      biometricAttendanceReady: isEnrolled,
    };
  }

  /**
   * Update child editable information (preserves biometrics and childCode)
   */
  async updateChildProfile(
    childId: string,
    dto: UpdateChildProfileDto,
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!existing) {
      throw new NotFoundException(`Child with ID ${childId} not found.`);
    }

    const updatePayload = dto as any;

    const updated = await this.prisma.child.update({
      where: { id: childId },
      data: {
        firstName: dto.firstName !== undefined ? dto.firstName.trim() : existing.firstName,
        lastName: dto.lastName !== undefined ? dto.lastName.trim() : existing.lastName,
        dateOfBirth: updatePayload.dateOfBirth ? new Date(updatePayload.dateOfBirth) : existing.dateOfBirth,
        approximateAge: dto.approximateAge !== undefined ? dto.approximateAge : existing.approximateAge,
        gender: dto.gender !== undefined ? (dto.gender as any) : existing.gender,
        bloodGroup: dto.bloodGroup !== undefined ? (dto.bloodGroup as any) : existing.bloodGroup,
        distinguishingMarks: dto.distinguishingMarks !== undefined ? dto.distinguishingMarks : existing.distinguishingMarks,
        photo: updatePayload.photo !== undefined ? updatePayload.photo : existing.photo,
        healthStatus: dto.healthStatus !== undefined ? (dto.healthStatus as any) : existing.healthStatus,
      },
    });

    await this.repository.createAuditLog({
      userId,
      action: 'CHILD_PROFILE_UPDATED',
      resource: 'Child',
      resourceId: childId,
      details: {
        updates: dto,
      },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  /**
   * Soft archive child record
   */
  async softArchiveChild(childId: string, reason: string, userId: string, ipAddress?: string) {
    const existing = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!existing) {
      throw new NotFoundException(`Child with ID ${childId} not found.`);
    }

    const archived = await this.prisma.child.update({
      where: { id: childId },
      data: {
        isActive: false,
        currentStatus: ChildStatus.TRANSFERRED,
      },
    });

    await this.repository.createAuditLog({
      userId,
      action: 'CHILD_ARCHIVED',
      resource: 'Child',
      resourceId: childId,
      details: { reason },
      ipAddress,
    });

    return archived;
  }

  /**
   * Add child document record
   */
  async addChildDocument(childId: string, dto: any, userId: string) {
    const existing = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!existing) {
      throw new NotFoundException(`Child with ID ${childId} not found.`);
    }

    const doc = await this.prisma.childDocument.create({
      data: {
        childId,
        title: dto.title || dto.documentName || 'Child Document',
        documentType: (dto.documentType || 'OTHER') as ChildDocumentType,
        fileName: dto.fileName || 'document.pdf',
        originalName: dto.title || 'document.pdf',
        mimeType: dto.mimeType || 'application/pdf',
        fileSize: Number(dto.fileSize) || 1024,
        storagePath: dto.storagePath || '/uploads/documents',
        storageUrl: dto.fileUrl || dto.documentUrl || null,
        uploadedById: userId,
      },
    });

    return doc;
  }

  /**
   * Search and filter children with pagination
   */
  async findAllChildren(query: any) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      isActive: query?.isArchived ? false : true,
    };

    if (query?.orphanageId) {
      whereClause.orphanageId = query.orphanageId;
    }

    if (query?.search) {
      const s = String(query.search).trim();
      whereClause.OR = [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { childCode: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (query?.gender) {
      whereClause.gender = query.gender;
    }

    if (query?.healthStatus) {
      whereClause.healthStatus = query.healthStatus;
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.child.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orphanage: {
            select: { name: true, code: true },
          },
          biometricData: {
            where: { isActive: true },
            select: { id: true, type: true, faceImageUrl: true },
          },
        },
      }),
      this.prisma.child.count({ where: whereClause }),
    ]);

    const formattedData = items.map((child) => {
      const smilingBio = child.biometricData.find((b: any) => b.faceImageUrl);
      const resolvedPhoto = child.photo || smilingBio?.faceImageUrl || null;
      return {
        ...child,
        photo: resolvedPhoto,
        fullName: `${child.firstName} ${child.lastName || ''}`.trim(),
        name: `${child.firstName} ${child.lastName || ''}`.trim(),
        age: child.approximateAge,
        risk: 'Low',
        health: child.healthStatus,
        attendance: 95,
        orphanage: child.orphanage?.name || 'Care Home',
      };
    });

    const [highRisk, adopted, needsReview] = await Promise.all([
      this.prisma.child.count({ where: { healthStatus: 'CRITICAL', isActive: true } }),
      this.prisma.child.count({ where: { currentStatus: 'ADOPTED', isActive: true } }),
      this.prisma.child.count({ where: { healthStatus: 'UNDER_TREATMENT', isActive: true } }),
    ]);

    return {
      data: formattedData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        total: totalCount,
        highRisk,
        adopted,
        needsReview,
      },
    };
  }
}
