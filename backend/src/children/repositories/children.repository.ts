import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Child, ChildStatus, Role } from '@prisma/client';

@Injectable()
export class ChildrenRepository {
  private readonly logger = new Logger(ChildrenRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if a child with similar credentials already exists in the given orphanage.
   */
  async checkDuplicateChild(params: {
    firstName: string;
    lastName?: string;
    dateOfBirth?: Date;
    orphanageId: string;
  }): Promise<boolean> {
    const { firstName, lastName, dateOfBirth, orphanageId } = params;

    const existing = await this.prisma.child.findFirst({
      where: {
        orphanageId,
        firstName: { equals: firstName, mode: 'insensitive' },
        ...(lastName && { lastName: { equals: lastName, mode: 'insensitive' } }),
        ...(dateOfBirth && { dateOfBirth }),
        deletedAt: null,
      },
    });

    return Boolean(existing);
  }

  /**
   * Executes a database transaction for child registration.
   */
  async createChildWithTransaction<T>(
    fn: (prismaTx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  /**
   * Resolves the Orphanage ID for orphanage staff users.
   */
  async findOrphanageIdForUser(userId: string): Promise<string | null> {
    const staff = await this.prisma.orphanageStaff.findFirst({
      where: { userId, isActive: true },
      select: { orphanageId: true },
    });
    return staff?.orphanageId || null;
  }

  /**
   * Resolves Orphanage name by ID.
   */
  async findOrphanageName(orphanageId: string): Promise<string> {
    const orphanage = await this.prisma.orphanage.findUnique({
      where: { id: orphanageId },
      select: { name: true },
    });
    return orphanage?.name || 'Assigned Orphanage';
  }

  /**
   * Finds all ADMIN users to receive notifications.
   */
  async findAdminUsers(): Promise<Array<{ id: string }>> {
    return this.prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
      select: { id: true },
    });
  }

  /**
   * Creates an audit log record.
   */
  async createAuditLog(data: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: true,
      },
    });
  }
}
