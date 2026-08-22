import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdoptionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import { CreateAdoptionDto, QueryAdoptionDto, UpdateAdoptionStatusDto } from './dto';
import { AlertsGenerationService } from '../alerts/alerts-generation.service';

export const REQUIRED_ADOPTION_DOCUMENTS = [
  'Adoption Agreement', 'Court Order', 'Guardian Consent', 'Identity Documents',
  'Medical Clearance', 'Child Transfer Form', 'Final Verification Letter', 'Additional Documents',
];

@Injectable()
export class AdoptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsGeneration: AlertsGenerationService,
  ) {}

  async verifyEligibility(parentId: string, childId: string, userId: string, role: Role) {
    const [parent, child] = await Promise.all([
      this.prisma.parent.findUnique({ where: { id: parentId }, include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } }, addresses: { where: { isPrimary: true }, take: 1 } } }),
      this.prisma.child.findUnique({ where: { id: childId }, include: { orphanage: { select: { id: true, name: true } }, adoptionRecord: { include: { documents: true } } } }),
    ]);
    if (!parent) throw new NotFoundException('Parent not found');
    if (!child || child.deletedAt) throw new NotFoundException('Child not found');
    await this.assertCanAccessChild(child.orphanageId, userId, role);

    const completedVisits = await this.prisma.visitRequest.count({ where: { parentId, childId, status: 'COMPLETED' } });
    const blockers: string[] = [];
    if (parent.verificationStatus !== 'APPROVED') blockers.push('Parent verification is not approved');
    if (parent.kycStatus !== 'APPROVED') blockers.push('Parent KYC is not approved');
    if (!child.isAdoptable || child.currentStatus === 'ADOPTED' || child.adoptionStatus === 'COMPLETED') blockers.push('Child is not available for adoption');
    if (child.adoptionRecord && child.adoptionRecord.adoptiveParentId !== parentId && !['CANCELLED', 'NOT_INITIATED'].includes(child.adoptionRecord.status)) blockers.push('Child already has an active adoption record');
    if (!completedVisits) blockers.push('A completed visit request is required');

    const address = parent.addresses[0];
    return {
      eligible: blockers.length === 0,
      blockers,
      parent: {
        id: parent.id, name: `${parent.user.firstName} ${parent.user.lastName || ''}`.trim(), email: parent.user.email,
        phone: parent.user.phone, address: address ? `${address.addressLine1}, ${address.city}, ${address.state}` : 'Not provided',
        verificationStatus: parent.verificationStatus, kycStatus: parent.kycStatus, trustScore: parent.trustScore,
      },
      child: {
        id: child.id, childCode: child.childCode, name: `${child.firstName} ${child.lastName || ''}`.trim(),
        age: child.dateOfBirth ? this.age(child.dateOfBirth) : child.approximateAge || 0, gender: child.gender,
        bloodGroup: child.bloodGroup, healthStatus: child.healthStatus, orphanageName: child.orphanage?.name || 'Unknown',
        adoptionStatus: child.adoptionStatus, isAdoptable: child.isAdoptable,
      },
      completedVisits,
      requiredDocuments: REQUIRED_ADOPTION_DOCUMENTS,
      adoption: child.adoptionRecord ? { id: child.adoptionRecord.id, status: child.adoptionRecord.status } : null,
    };
  }

  async create(dto: CreateAdoptionDto, userId: string, role: Role) {
    const check = await this.verifyEligibility(dto.parentId, dto.childId, userId, role);
    if (!check.eligible) throw new BadRequestException(check.blockers);
    if (!dto.declarationAccepted) throw new BadRequestException('The legal declaration must be accepted');
    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.adoptionRecord.create({ data: { childId: dto.childId, adoptiveParentId: dto.parentId, status: AdoptionStatus.LEGAL_PROCESS, legalProcessStart: new Date(), reviewedById: userId, reviewNotes: dto.reviewNotes } });
      await tx.child.update({ where: { id: dto.childId }, data: { adoptionStatus: AdoptionStatus.LEGAL_PROCESS } });
      await tx.auditLog.create({ data: { userId, action: 'ADOPTION_SUBMITTED', resource: 'AdoptionRecord', resourceId: created.id, details: { parentId: dto.parentId, childId: dto.childId } } });
      return created;
    });
    return this.findOne(record.id, userId, role);
  }

  async uploadDocument(adoptionId: string, documentType: string, file: Express.Multer.File, userId: string, role: Role, fileInfo: { fileName: string; storagePath: string; storageUrl: string }) {
    if (!REQUIRED_ADOPTION_DOCUMENTS.includes(documentType)) throw new BadRequestException('Unsupported adoption document type');
    if (!file) throw new BadRequestException('A document file is required');
    const record = await this.prisma.adoptionRecord.findUnique({ where: { id: adoptionId }, include: { child: true } });
    if (!record) throw new NotFoundException('Adoption record not found');
    await this.assertCanAccessChild(record.child.orphanageId, userId, role);
    if (!['LEGAL_PROCESS', 'UNDER_REVIEW', 'MATCHED'].includes(record.status)) throw new BadRequestException('Documents can only be uploaded while an adoption is under review');
    const doc = await this.prisma.adoptionDocument.upsert({
      where: { adoptionRecordId_documentType: { adoptionRecordId: adoptionId, documentType } },
      create: { adoptionRecordId: adoptionId, documentType, fileName: fileInfo.fileName, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, storagePath: fileInfo.storagePath, storageUrl: fileInfo.storageUrl, isVerified: true, verifiedById: userId, verifiedAt: new Date(), uploadedById: userId },
      update: { fileName: fileInfo.fileName, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, storagePath: fileInfo.storagePath, storageUrl: fileInfo.storageUrl, isVerified: true, verifiedById: userId, verifiedAt: new Date(), uploadedById: userId },
    });
    await this.prisma.auditLog.create({ data: { userId, action: 'ADOPTION_DOCUMENT_UPLOADED', resource: 'AdoptionDocument', resourceId: doc.id, details: { adoptionId, documentType } } });
    return doc;
  }

  async updateStatus(id: string, dto: UpdateAdoptionStatusDto, userId: string) {
    const record = await this.prisma.adoptionRecord.findUnique({ where: { id }, include: { documents: true, child: true, adoptiveParent: { include: { user: true } } } });
    if (!record) throw new NotFoundException('Adoption record not found');
    if (![AdoptionStatus.COMPLETED, AdoptionStatus.CANCELLED].includes(dto.status as typeof AdoptionStatus.COMPLETED | typeof AdoptionStatus.CANCELLED)) throw new BadRequestException('Only completed or cancelled statuses are supported');
    if (dto.status === AdoptionStatus.CANCELLED && !dto.cancellationReason) throw new BadRequestException('A cancellation reason is required');
    if (dto.status === AdoptionStatus.COMPLETED) {
      if (record.status === AdoptionStatus.COMPLETED) throw new BadRequestException('Adoption is already completed');
      const missing = REQUIRED_ADOPTION_DOCUMENTS.filter((type) => !record.documents.some((doc) => doc.documentType === type && doc.isVerified));
      if (missing.length) throw new BadRequestException(`Verified documents required: ${missing.join(', ')}`);
      return this.prisma.$transaction(async (tx) => {
        const completedAt = new Date();
        const firstFollowUp = new Date(completedAt); firstFollowUp.setDate(firstFollowUp.getDate() + 30);
        const secondFollowUp = new Date(completedAt); secondFollowUp.setDate(secondFollowUp.getDate() + 90);
        const updated = await tx.adoptionRecord.update({ where: { id }, data: { status: AdoptionStatus.COMPLETED, completedDate: completedAt, reviewedById: userId, reviewNotes: dto.reviewNotes, postAdoptionFollowUp1: firstFollowUp, postAdoptionFollowUp2: secondFollowUp } });
        await tx.child.update({ where: { id: record.childId }, data: { adoptionStatus: AdoptionStatus.COMPLETED, currentStatus: 'ADOPTED', isAdoptable: false } });
        await tx.welfareSession.createMany({ data: [{ childId: record.childId, scheduledAt: firstFollowUp }, { childId: record.childId, scheduledAt: secondFollowUp }] });
        await tx.notification.create({ data: { userId: record.adoptiveParent!.userId, type: 'ADOPTION_STATUS_CHANGED', title: 'Adoption approved', body: `The adoption of ${record.child.firstName} has been approved.`, relatedEntityType: 'AdoptionRecord', relatedEntityId: id } });
        await tx.auditLog.create({ data: { userId, action: 'ADOPTION_COMPLETED', resource: 'AdoptionRecord', resourceId: id, details: { childId: record.childId, parentId: record.adoptiveParentId } } });
        return updated;
      });
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const value = await tx.adoptionRecord.update({ where: { id }, data: { status: AdoptionStatus.CANCELLED, cancelledDate: new Date(), cancellationReason: dto.cancellationReason, reviewNotes: dto.reviewNotes, reviewedById: userId } });
      await tx.child.update({ where: { id: record.childId }, data: { adoptionStatus: AdoptionStatus.ELIGIBLE } });
      await tx.auditLog.create({ data: { userId, action: 'ADOPTION_CANCELLED', resource: 'AdoptionRecord', resourceId: id, details: { reason: dto.cancellationReason } } });
      return value;
    });

    // Fire ADOPTION_BLOCKED alert asynchronously — must not block response
    void this.alertsGeneration.onAdoptionCancelled(
      record.childId,
      record.adoptiveParentId!,
      record.child.orphanageId ?? null,
      dto.cancellationReason!,
      userId,
    );

    return updated;
  }

  async findAll(query: QueryAdoptionDto, userId: string, role: Role) {
    const where: Prisma.AdoptionRecordWhereInput = { status: query.status };
    if (query.search) where.OR = [{ child: { firstName: { contains: query.search, mode: 'insensitive' } } }, { child: { childCode: { contains: query.search, mode: 'insensitive' } } }, { adoptiveParent: { user: { firstName: { contains: query.search, mode: 'insensitive' } } } }];
    if (role === Role.PARENT) where.adoptiveParent = { userId };
    if (role === Role.ORPHANAGE) where.child = { orphanageId: await this.orphanageFor(userId) };
    const [total, rows] = await this.prisma.$transaction([this.prisma.adoptionRecord.count({ where }), this.prisma.adoptionRecord.findMany({ where, include: this.include(), orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit })]);
    return { data: rows.map((row) => this.serialize(row)), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async findOne(id: string, userId: string, role: Role) {
    const row = await this.prisma.adoptionRecord.findUnique({ where: { id }, include: this.include() });
    if (!row) throw new NotFoundException('Adoption record not found');
    if (role === Role.PARENT && row.adoptiveParent?.userId !== userId) throw new ForbiddenException('You do not have access to this adoption');
    await this.assertCanAccessChild(row.child.orphanageId, userId, role);
    return this.serialize(row);
  }

  private include() { return { child: { include: { orphanage: { select: { id: true, name: true } } } }, adoptiveParent: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } }, documents: { orderBy: { documentType: 'asc' } } } as const; }
  private serialize(row: any) { return { id: row.id, status: row.status, completedDate: row.completedDate, legalProcessStart: row.legalProcessStart, postAdoptionFollowUp1: row.postAdoptionFollowUp1, postAdoptionFollowUp2: row.postAdoptionFollowUp2, reviewNotes: row.reviewNotes, child: { id: row.child.id, childCode: row.child.childCode, name: `${row.child.firstName} ${row.child.lastName || ''}`.trim(), orphanageName: row.child.orphanage?.name }, parent: row.adoptiveParent ? { id: row.adoptiveParent.id, name: `${row.adoptiveParent.user.firstName} ${row.adoptiveParent.user.lastName || ''}`.trim(), email: row.adoptiveParent.user.email } : null, documents: row.documents || [] }; }
  private age(dob: Date) { return Math.floor((Date.now() - dob.getTime()) / 31557600000); }
  private async orphanageFor(userId: string) { const staff = await this.prisma.orphanageStaff.findFirst({ where: { userId, isActive: true }, select: { orphanageId: true } }); if (!staff) throw new ForbiddenException('User is not associated with an orphanage'); return staff.orphanageId; }
  private async assertCanAccessChild(orphanageId: string | null, userId: string, role: Role) { if (role === Role.ORPHANAGE && orphanageId !== await this.orphanageFor(userId)) throw new ForbiddenException('You do not have access to this child'); }
}
