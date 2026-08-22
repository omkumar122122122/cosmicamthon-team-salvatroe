import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class OrphanageOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin can access all orphanage data
    if (user.role === Role.ADMIN) {
      return true;
    }

    // For ORPHANAGE role, verify they're linked to an orphanage
    if (user.role === Role.ORPHANAGE) {
      let orphanageId: string | undefined = user.orphanageId;
      const targetUserId = user.sub || user.id;

      if (!orphanageId) {
        const orphanage = await this.prisma.orphanage.findFirst({
          where: { userId: targetUserId, deletedAt: null },
          select: { id: true },
        });
        if (orphanage) {
          orphanageId = orphanage.id;
        } else {
          const staffRecord = await this.prisma.orphanageStaff.findFirst({
            where: {
              userId: targetUserId,
              isActive: true,
            },
            select: { orphanageId: true },
          });
          if (staffRecord?.orphanageId) {
            orphanageId = staffRecord.orphanageId;
          }
        }
      }

      if (!orphanageId) {
        throw new NotFoundException('No orphanage found for this user');
      }

      // Store orphanageId in request for later use
      request.orphanageId = orphanageId;
      return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
