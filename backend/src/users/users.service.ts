import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, UpdateUserRoleDto, UpdateUserStatusDto } from './dto/update-user.dto';
import { Role } from '../common/enums/role.enum';

// Fields safe to return to the client
const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatar: true,
  role: true,
  isActive: true,
  isEmailVerified: true,
  isTwoFactorEnabled: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
} as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // Find
  // ─────────────────────────────────────────────

  async findAll(params: {
    page?: number;
    limit?: number;
    role?: Role;
    search?: string;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 20, role, search, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (role) where.role = role;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  // ─────────────────────────────────────────────
  // Update
  // ─────────────────────────────────────────────

  async updateProfile(userId: string, dto: UpdateUserDto) {
    // Check phone uniqueness if changing phone
    if (dto.phone) {
      const existing = await this.prisma.user.findFirst({
        where: { phone: dto.phone, NOT: { id: userId } },
      });
      if (existing) throw new ConflictException('Phone number already in use');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { ...dto },
      select: USER_SELECT,
    });

    this.logger.log(`Profile updated for user: ${user.id}`);
    return user;
  }

  async updateRole(targetUserId: string, dto: UpdateUserRoleDto, requestingUserId: string) {
    // Prevent self-role-change for safety
    if (targetUserId === requestingUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
      select: USER_SELECT,
    });

    this.logger.log(`Role updated to ${dto.role} for user: ${targetUserId}`);
    return user;
  }

  async updateStatus(targetUserId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: dto.isActive },
      select: USER_SELECT,
    });

    this.logger.log(
      `User ${dto.isActive ? 'activated' : 'deactivated'}: ${targetUserId}`,
    );
    return user;
  }

  // ─────────────────────────────────────────────
  // Delete (soft)
  // ─────────────────────────────────────────────

  async softDelete(targetUserId: string, requestingUserId: string) {
    if (targetUserId === requestingUserId) {
      throw new ForbiddenException('You cannot delete your own account via this endpoint');
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`User soft-deleted: ${targetUserId}`);
    return { message: 'User account deleted successfully' };
  }

  // ─────────────────────────────────────────────
  // Stats (admin)
  // ─────────────────────────────────────────────

  async getStats() {
    const [total, active, byRole, recentRegistrations] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
        where: { deletedAt: null },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          deletedAt: null,
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byRole: byRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count.id }), {}),
      recentRegistrations,
    };
  }
}
