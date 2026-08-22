import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChildrenRepository } from '../../repositories/children.repository';
import { RequestChildTransferDto } from '../dto/transfer-child.dto';

export interface ITransferRecord {
  id: string;
  childId: string;
  childCode: string;
  fromOrphanageId: string;
  toOrphanageId: string;
  reason: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedById: string;
  requestedAt: Date;
  reviewedById?: string;
  reviewedAt?: Date;
}

@Injectable()
export class ChildTransferManagementService {
  private readonly logger = new Logger(ChildTransferManagementService.name);
  private static transferStore = new Map<string, ITransferRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly childrenRepository: ChildrenRepository
  ) {}

  /**
   * Initiates a child transfer request between orphanages.
   */
  async requestTransfer(childId: string, dto: RequestChildTransferDto, staffUserId: string) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: { orphanage: true },
    });

    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found.`);
    }

    if (!child.isActive) {
      throw new BadRequestException(`Cannot transfer an inactive or archived child.`);
    }

    const targetOrphanage = await this.prisma.orphanage.findUnique({
      where: { id: dto.targetOrphanageId },
    });

    if (!targetOrphanage) {
      throw new NotFoundException(`Target orphanage with ID ${dto.targetOrphanageId} not found.`);
    }

    if (child.orphanageId === dto.targetOrphanageId) {
      throw new BadRequestException(`Child is already registered in target orphanage.`);
    }

    const transferId = `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const record: ITransferRecord = {
      id: transferId,
      childId: child.id,
      childCode: child.childCode,
      fromOrphanageId: child.orphanageId || 'UNASSIGNED',
      toOrphanageId: targetOrphanage.id,
      reason: dto.reason,
      notes: dto.transferNotes,
      status: 'PENDING',
      requestedById: staffUserId,
      requestedAt: new Date(),
    };

    ChildTransferManagementService.transferStore.set(transferId, record);

    // Record Audit Log
    await this.childrenRepository.createAuditLog({
      userId: staffUserId,
      action: 'CHILD_TRANSFER_REQUESTED',
      resource: 'Child',
      resourceId: child.id,
      details: {
        childCode: child.childCode,
        fromOrphanage: child.orphanage?.name || 'Current Facility',
        toOrphanage: targetOrphanage.name,
        reason: dto.reason,
      },
    });

    this.logger.log(`Transfer ${transferId} requested for child ${child.childCode} to ${targetOrphanage.name}`);

    return {
      statusCode: 201,
      message: 'Child transfer request submitted successfully. Awaiting CWC admin approval.',
      data: record,
    };
  }

  /**
   * Admin approves child transfer request inside a Prisma transaction.
   * Preserves childCode, biometric vectors, and all historical records.
   */
  async approveTransfer(transferId: string, adminUserId: string, notes?: string) {
    const record = ChildTransferManagementService.transferStore.get(transferId);
    if (!record) {
      throw new NotFoundException(`Transfer request with ID ${transferId} not found.`);
    }

    if (record.status !== 'PENDING') {
      throw new BadRequestException(`Transfer request is already ${record.status}.`);
    }

    // Run inter-orphanage transfer inside Prisma transaction
    await this.prisma.$transaction(async (prismaTx) => {
      // 1. Update child facility reference
      await prismaTx.child.update({
        where: { id: record.childId },
        data: {
          orphanageId: record.toOrphanageId,
          internalNotes: `Transferred from orphanage ${record.fromOrphanageId} to ${record.toOrphanageId}. Approved by Admin ${adminUserId}.`,
        },
      });

      // 2. Mark transfer record approved
      record.status = 'APPROVED';
      record.reviewedById = adminUserId;
      record.reviewedAt = new Date();
      record.notes = notes || record.notes;

      ChildTransferManagementService.transferStore.set(transferId, record);
    });

    // Record Audit Log
    await this.childrenRepository.createAuditLog({
      userId: adminUserId,
      action: 'CHILD_TRANSFER_APPROVED',
      resource: 'Child',
      resourceId: record.childId,
      details: {
        transferId,
        childCode: record.childCode,
        newOrphanageId: record.toOrphanageId,
      },
    });

    this.logger.log(`Transfer ${transferId} APPROVED by admin ${adminUserId}`);

    return {
      statusCode: 200,
      message: `Child transfer ${record.childCode} approved successfully. Biometric data preserved.`,
      data: record,
    };
  }

  /**
   * Admin rejects child transfer request.
   */
  async rejectTransfer(transferId: string, adminUserId: string, notes?: string) {
    const record = ChildTransferManagementService.transferStore.get(transferId);
    if (!record) {
      throw new NotFoundException(`Transfer request with ID ${transferId} not found.`);
    }

    record.status = 'REJECTED';
    record.reviewedById = adminUserId;
    record.reviewedAt = new Date();
    record.notes = notes || record.notes;

    ChildTransferManagementService.transferStore.set(transferId, record);

    await this.childrenRepository.createAuditLog({
      userId: adminUserId,
      action: 'CHILD_TRANSFER_REJECTED',
      resource: 'Child',
      resourceId: record.childId,
      details: { transferId, childCode: record.childCode, reason: notes },
    });

    return {
      statusCode: 200,
      message: `Transfer request ${transferId} rejected.`,
      data: record,
    };
  }

  /**
   * List all pending transfer requests.
   */
  async getPendingTransfers() {
    return Array.from(ChildTransferManagementService.transferStore.values()).filter(
      (t) => t.status === 'PENDING'
    );
  }
}
