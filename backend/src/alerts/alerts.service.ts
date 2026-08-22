import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AlertStatus, AlertSeverity, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import { QueryAlertDto } from './dto/query-alert.dto';

// ─────────────────────────────────────────────────────────────
// Response shape (what the frontend actually consumes)
// alertsService.js → unwrap(response) → response.data
// response.data = { data: AlertItem[], stats: { total, high, pending } }
// ─────────────────────────────────────────────────────────────
export interface AlertItem {
  id: string;
  type: string;
  title: string;
  /** Mapped from DB field `details` — frontend reads `.detail` */
  detail: string;
  severity: string;
  status: string;
  /** Child's full name or "General" */
  child: string;
  /** Orphanage name or "All facilities" */
  orphanage: string;
  createdAt: Date;
}

export interface AlertListPayload {
  data: AlertItem[];
  stats: {
    total: number;
    high: number;
    pending: number;
  };
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────
  // GET /alerts
  // Returns: { success: true, data: { data: AlertItem[], stats } }
  // ───────────────────────────────────────────────────────────
  async findAll(
    userId: string,
    role: Role,
    query: QueryAlertDto,
  ): Promise<{ success: true; data: AlertListPayload }> {
    const scope = await this.buildScope(userId, role);

    // Apply optional query filters on top of the role scope
    const where: Prisma.AlertWhereInput = { ...scope };
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.type) where.type = query.type;

    // Pending = not yet resolved/closed
    const pendingStatuses: AlertStatus[] = [
      AlertStatus.OPEN,
      AlertStatus.ACKNOWLEDGED,
      AlertStatus.IN_PROGRESS,
    ];

    const highSeverities: AlertSeverity[] = [
      AlertSeverity.HIGH,
      AlertSeverity.CRITICAL,
    ];

    const [alerts, total, high, pending] = await this.prisma.$transaction([
      this.prisma.alert.findMany({
        where,
        include: {
          child: { select: { firstName: true, lastName: true } },
          orphanage: { select: { name: true } },
        },
        orderBy: [
          // Critical/High first, then by creation date descending
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.alert.count({ where }),
      this.prisma.alert.count({
        where: { ...where, severity: { in: highSeverities } },
      }),
      this.prisma.alert.count({
        where: { ...where, status: { in: pendingStatuses } },
      }),
    ]);

    const data: AlertItem[] = alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      title: alert.title,
      detail: alert.details || alert.title,
      severity: alert.severity,
      status: alert.status,
      child: alert.child
        ? `${alert.child.firstName} ${alert.child.lastName || ''}`.trim()
        : 'General',
      orphanage: alert.orphanage?.name || 'All facilities',
      createdAt: alert.createdAt,
    }));

    return {
      success: true,
      data: {
        data,
        stats: { total, high, pending },
      },
    };
  }

  // ───────────────────────────────────────────────────────────
  // PATCH /alerts/:id/resolve
  // Only ADMIN and ORPHANAGE can resolve (enforced at controller)
  // ───────────────────────────────────────────────────────────
  async resolve(
    id: string,
    userId: string,
    role: Role,
  ): Promise<{ success: true; message: string }> {
    const scope = await this.buildScope(userId, role);

    const alert = await this.prisma.alert.findFirst({
      where: { ...scope, id },
    });

    if (!alert) {
      throw new NotFoundException(
        `Alert ${id} not found or not accessible`,
      );
    }

    if (alert.status === AlertStatus.RESOLVED) {
      return { success: true, message: 'Alert was already resolved' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.alert.update({
        where: { id },
        data: {
          status: AlertStatus.RESOLVED,
          resolvedAt: new Date(),
          resolvedById: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'ALERT_RESOLVED',
          resource: 'Alert',
          resourceId: id,
          details: { alertType: alert.type, severity: alert.severity },
          success: true,
        },
      });
    });

    this.logger.log(`Alert ${id} resolved by user ${userId} (role: ${role})`);
    return { success: true, message: 'Alert resolved successfully' };
  }

  // ───────────────────────────────────────────────────────────
  // Role-scoped WHERE clause
  // ADMIN      → see all alerts
  // ORPHANAGE  → only alerts linked to their orphanage
  // PARENT     → only alerts linked to their parent profile
  //              OR alerts on a child they have adopted
  // ───────────────────────────────────────────────────────────
  private async buildScope(
    userId: string,
    role: Role,
  ): Promise<Prisma.AlertWhereInput> {
    if (role === Role.ADMIN) {
      return {}; // Unrestricted
    }

    if (role === Role.ORPHANAGE) {
      const staff = await this.prisma.orphanageStaff.findFirst({
        where: { userId, isActive: true },
        select: { orphanageId: true },
      });
      if (!staff) {
        throw new ForbiddenException(
          'Your account is not linked to any orphanage',
        );
      }
      return { orphanageId: staff.orphanageId };
    }

    if (role === Role.PARENT) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!parent) {
        throw new ForbiddenException(
          'Your account does not have a parent profile',
        );
      }
      return {
        OR: [
          // Alerts directly linked to this parent
          { parentId: parent.id },
          // Alerts on a child this parent has adopted
          {
            child: {
              adoptionRecord: {
                adoptiveParentId: parent.id,
              },
            },
          },
        ],
      };
    }

    // Any other role (SOCIAL_WORKER, GUEST) — deny
    throw new ForbiddenException('You do not have access to alerts');
  }
}
