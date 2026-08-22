import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import { Prisma, OrphanageStaffRole, StaffType } from '@prisma/client';
import {
  CreateStaffDto,
  UpdateStaffDto,
  QueryStaffDto,
  StaffProfileDto,
  StaffBasicDto,
  StaffListResponseDto,
  StaffSummaryDto,
  CreateStaffResponseDto,
} from './dto';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateStaffDto,
    requestUserId: string,
    requestUserRole: Role,
    requestUserOrphanageId?: string,
  ): Promise<CreateStaffResponseDto> {
    if (requestUserRole === Role.ADMIN && (!dto.staffType || dto.staffType === StaffType.ADMIN)) {
      return this.createAdminStaff(dto, requestUserId);
    }
    return this.createOrphanageStaff(dto, requestUserId, requestUserRole, requestUserOrphanageId);
  }

  async createAdminStaff(
    dto: CreateStaffDto,
    requestUserId: string,
  ): Promise<CreateStaffResponseDto> {
    this.logger.log(`[Admin Staff Creation] Logged-in admin user: ${requestUserId}`);

    const ADMIN_ROLES: OrphanageStaffRole[] = [
      OrphanageStaffRole.SUPER_ADMIN,
      OrphanageStaffRole.ADMIN,
      OrphanageStaffRole.MODERATOR,
      OrphanageStaffRole.GOVERNMENT_OFFICER,
    ];

    if (dto.role && !ADMIN_ROLES.includes(dto.role as OrphanageStaffRole)) {
      throw new BadRequestException(
        `Admin staff role must be one of: SUPER_ADMIN, ADMIN, MODERATOR, GOVERNMENT_OFFICER. Received: ${dto.role}`,
      );
    }

    const assignedRole = dto.role || OrphanageStaffRole.ADMIN;

    let targetUserId = dto.userId && dto.userId.trim() !== '' ? dto.userId : null;
    if (!targetUserId) {
      if (dto.email && dto.email.trim() !== '') {
        const lowerEmail = dto.email.toLowerCase().trim();
        let userRecord = await this.prisma.user.findUnique({
          where: { email: lowerEmail },
        });

        if (!userRecord) {
          const nameParts = (dto.name || 'Admin Staff').trim().split(' ');
          const firstName = nameParts[0] || 'Admin';
          const lastName = nameParts.slice(1).join(' ') || 'Staff';
          const hashedPassword = await bcrypt.hash('Admin@123456', 10);

          userRecord = await this.prisma.user.create({
            data: {
              email: lowerEmail,
              firstName,
              lastName,
              password: hashedPassword,
              role: Role.ADMIN,
              isEmailVerified: true,
            },
          });
        }
        targetUserId = userRecord.id;
      } else {
        targetUserId = requestUserId;
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    const staff = await this.prisma.orphanageStaff.create({
      data: {
        userId: targetUserId,
        orphanageId: null,
        staffType: StaffType.ADMIN,
        role: assignedRole,
        designation: dto.designation || 'System Admin',
        employeeId: dto.employeeId,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        notes: dto.notes,
        createdBy: requestUserId,
        isActive: true,
      },
    });

    this.logger.log(`Admin staff member ${staff.id} created by ${requestUserId}`);

    return {
      id: staff.id,
      employeeId: staff.employeeId || undefined,
      name: `${user.firstName} ${user.lastName}`,
      role: staff.role,
      orphanageName: 'Platform Administration',
      createdAt: staff.createdAt,
    };
  }

  async createOrphanageStaff(
    dto: CreateStaffDto,
    requestUserId: string,
    requestUserRole: Role,
    requestUserOrphanageId?: string,
  ): Promise<CreateStaffResponseDto> {
    this.logger.log(`[Orphanage Staff Creation] Logged-in user: ${requestUserId}, Role: ${requestUserRole}`);

    const ADMIN_ROLES: OrphanageStaffRole[] = [
      OrphanageStaffRole.SUPER_ADMIN,
      OrphanageStaffRole.ADMIN,
      OrphanageStaffRole.MODERATOR,
      OrphanageStaffRole.GOVERNMENT_OFFICER,
    ];

    if (dto.role && ADMIN_ROLES.includes(dto.role as OrphanageStaffRole)) {
      throw new BadRequestException(
        `Orphanage staff cannot be assigned System Admin roles (${dto.role}).`,
      );
    }

    let targetOrphanageId: string | null = null;
    if (requestUserRole === Role.ORPHANAGE) {
      targetOrphanageId = requestUserOrphanageId || (await this.getUserOrphanageId(requestUserId));
    } else {
      targetOrphanageId = dto.orphanageId || requestUserOrphanageId || (await this.getUserOrphanageId(requestUserId));
    }

    if (!targetOrphanageId) {
      throw new BadRequestException('Orphanage ID is required for Orphanage Staff');
    }

    const orphanage = await this.prisma.orphanage.findUnique({
      where: { id: targetOrphanageId },
      select: { id: true, name: true, isActive: true, deletedAt: true },
    });

    if (!orphanage || orphanage.deletedAt) {
      throw new NotFoundException(`Orphanage with ID ${targetOrphanageId} not found`);
    }

    if (!orphanage.isActive) {
      throw new BadRequestException('Cannot add staff to inactive orphanage');
    }

    let targetUserId = dto.userId && dto.userId.trim() !== '' ? dto.userId : null;
    if (!targetUserId) {
      if (dto.email && dto.email.trim() !== '') {
        const lowerEmail = dto.email.toLowerCase().trim();
        let userRecord = await this.prisma.user.findUnique({
          where: { email: lowerEmail },
        });

        if (!userRecord) {
          const nameParts = (dto.name || 'Staff Member').trim().split(' ');
          const firstName = nameParts[0] || 'Staff';
          const lastName = nameParts.slice(1).join(' ') || 'Member';
          const hashedPassword = await bcrypt.hash('Staff@123456', 10);

          userRecord = await this.prisma.user.create({
            data: {
              email: lowerEmail,
              firstName,
              lastName,
              password: hashedPassword,
              role: Role.ORPHANAGE,
              isEmailVerified: true,
            },
          });
        }
        targetUserId = userRecord.id;
      } else {
        targetUserId = requestUserId;
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    const staff = await this.prisma.orphanageStaff.create({
      data: {
        userId: targetUserId,
        orphanageId: targetOrphanageId,
        staffType: StaffType.ORPHANAGE,
        role: dto.role || OrphanageStaffRole.CARETAKER,
        designation: dto.designation,
        employeeId: dto.employeeId,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        notes: dto.notes,
        createdBy: requestUserId,
        isActive: true,
      },
    });

    this.logger.log(`Orphanage staff member ${staff.id} created for orphanage ${targetOrphanageId}`);

    return {
      id: staff.id,
      employeeId: staff.employeeId || undefined,
      name: `${user.firstName} ${user.lastName}`,
      role: staff.role,
      orphanageName: orphanage.name,
      createdAt: staff.createdAt,
    };
  }

  async findAllAdminStaff(
    queryDto: QueryStaffDto,
    requestUserId: string,
  ): Promise<StaffListResponseDto> {
    const {
      search,
      role,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'joiningDate',
      sortOrder = 'desc',
    } = queryDto;

    const andConditions: Prisma.OrphanageStaffWhereInput[] = [
      { staffType: StaffType.ADMIN },
    ];

    if (role) andConditions.push({ role });
    if (isActive !== undefined) andConditions.push({ isActive });

    if (search) {
      andConditions.push({
        OR: [
          { employeeId: { contains: search, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        ],
      });
    }

    const where: Prisma.OrphanageStaffWhereInput = { AND: andConditions };
    const skip = (page - 1) * limit;

    const total = await this.prisma.orphanageStaff.count({ where });

    let orderBy: Prisma.OrphanageStaffOrderByWithRelationInput = {};
    if (sortBy === 'name') {
      orderBy = { user: { firstName: sortOrder } };
    } else if (sortBy === 'joiningDate' || sortBy === 'role' || sortBy === 'employeeId') {
      orderBy = { [sortBy]: sortOrder };
    } else {
      orderBy = { joiningDate: sortOrder };
    }

    const staff = await this.prisma.orphanageStaff.findMany({
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
        orphanage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const data: StaffBasicDto[] = staff.map((s) => ({
      id: s.id,
      employeeId: s.employeeId || undefined,
      name: `${s.user.firstName} ${s.user.lastName}`,
      role: s.role,
      designation: s.designation || 'System Admin',
      joiningDate: s.joiningDate || new Date(),
      isActive: s.isActive,
      orphanageName: 'Platform Administration',
      userEmail: s.user.email,
      userPhone: s.user.phone || undefined,
    }));

    const summary = await this.getSummaryStats(undefined, StaffType.ADMIN);

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

  async findAllOrphanageStaff(
    queryDto: QueryStaffDto,
    requestUserId: string,
    requestUserRole: Role,
    requestUserOrphanageId?: string,
  ): Promise<StaffListResponseDto> {
    const {
      search,
      orphanageId,
      role,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'joiningDate',
      sortOrder = 'desc',
    } = queryDto;

    const andConditions: Prisma.OrphanageStaffWhereInput[] = [
      { staffType: StaffType.ORPHANAGE },
    ];

    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = requestUserOrphanageId || (await this.getUserOrphanageId(requestUserId));
      andConditions.push({ orphanageId: userOrphanageId });
    } else if (orphanageId) {
      andConditions.push({ orphanageId });
    }

    if (role) andConditions.push({ role });
    if (isActive !== undefined) andConditions.push({ isActive });

    if (search) {
      andConditions.push({
        OR: [
          { employeeId: { contains: search, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        ],
      });
    }

    const where: Prisma.OrphanageStaffWhereInput = { AND: andConditions };
    const skip = (page - 1) * limit;

    const total = await this.prisma.orphanageStaff.count({ where });

    let orderBy: Prisma.OrphanageStaffOrderByWithRelationInput = {};
    if (sortBy === 'name') {
      orderBy = { user: { firstName: sortOrder } };
    } else if (sortBy === 'joiningDate' || sortBy === 'role' || sortBy === 'employeeId') {
      orderBy = { [sortBy]: sortOrder };
    } else {
      orderBy = { joiningDate: sortOrder };
    }

    const staff = await this.prisma.orphanageStaff.findMany({
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
        orphanage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const data: StaffBasicDto[] = staff.map((s) => ({
      id: s.id,
      employeeId: s.employeeId || undefined,
      name: `${s.user.firstName} ${s.user.lastName}`,
      role: s.role,
      designation: s.designation || undefined,
      joiningDate: s.joiningDate || new Date(),
      isActive: s.isActive,
      orphanageName: s.orphanage?.name || 'N/A',
      userEmail: s.user.email,
      userPhone: s.user.phone || undefined,
    }));

    const targetOrphId = requestUserRole === Role.ORPHANAGE
      ? (requestUserOrphanageId || (await this.getUserOrphanageId(requestUserId)))
      : orphanageId;

    const summary = await this.getSummaryStats(targetOrphId, StaffType.ORPHANAGE);

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

  async findAll(
    queryDto: QueryStaffDto,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<StaffListResponseDto> {
    if (requestUserRole === Role.ADMIN && queryDto.staffType === StaffType.ADMIN) {
      return this.findAllAdminStaff(queryDto, requestUserId);
    }
    return this.findAllOrphanageStaff(queryDto, requestUserId, requestUserRole);
  }

  async findOne(
    id: string,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<StaffProfileDto> {
    const staff = await this.prisma.orphanageStaff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        orphanage: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    // Orphanage users can only view their own staff
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (staff.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You do not have access to this staff member',
        );
      }
    }

    return {
      id: staff.id,
      employeeId: staff.employeeId || undefined,
      role: staff.role,
      designation: staff.designation || undefined,
      joiningDate: staff.joiningDate || new Date(),
      endDate: staff.endDate || undefined,
      isActive: staff.isActive,
      notes: staff.notes || undefined,
      user: {
        id: staff.user.id,
        email: staff.user.email,
        firstName: staff.user.firstName,
        lastName: staff.user.lastName,
        phone: staff.user.phone || undefined,
        avatar: staff.user.avatar || undefined,
      },
      orphanage: staff.orphanage
        ? {
            id: staff.orphanage.id,
            name: staff.orphanage.name,
            city: staff.orphanage.city,
            state: staff.orphanage.state,
          }
        : undefined,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };
  }

  async update(
    id: string,
    dto: UpdateStaffDto,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<void> {
    const staff = await this.prisma.orphanageStaff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    // Orphanage users can only update their own staff
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (staff.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You do not have access to update this staff member',
        );
      }
    }

    // Validate end date if provided
    if (dto.endDate && staff.joiningDate) {
      const endDate = new Date(dto.endDate);
      if (endDate <= staff.joiningDate) {
        throw new BadRequestException(
          'End date must be after joining date',
        );
      }
    }

    await this.prisma.orphanageStaff.update({
      where: { id },
      data: {
        role: dto.role,
        designation: dto.designation,
        employeeId: dto.employeeId,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Staff member ${id} updated by user ${requestUserId}`);
  }

  async deactivate(
    id: string,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<void> {
    const staff = await this.prisma.orphanageStaff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    if (!staff.isActive) {
      throw new BadRequestException('Staff member is already deactivated');
    }

    // Orphanage users can only deactivate their own staff
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (staff.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You do not have access to deactivate this staff member',
        );
      }
    }

    await this.prisma.orphanageStaff.update({
      where: { id },
      data: {
        isActive: false,
        endDate: staff.endDate || new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Staff member ${id} deactivated by user ${requestUserId}`,
    );
  }

  async reactivate(
    id: string,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<void> {
    const staff = await this.prisma.orphanageStaff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    if (staff.isActive) {
      throw new BadRequestException('Staff member is already active');
    }

    // Orphanage users can only reactivate their own staff
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (staff.orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You do not have access to reactivate this staff member',
        );
      }
    }

    await this.prisma.orphanageStaff.update({
      where: { id },
      data: {
        isActive: true,
        endDate: null,
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Staff member ${id} reactivated by user ${requestUserId}`,
    );
  }

  async getAvailableStaff(
    orphanageId: string,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<StaffBasicDto[]> {
    // Orphanage users can only get their own staff
    if (requestUserRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(requestUserId);
      if (orphanageId !== userOrphanageId) {
        throw new ForbiddenException(
          'You can only access staff from your orphanage',
        );
      }
    }

    const staff = await this.prisma.orphanageStaff.findMany({
      where: {
        orphanageId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        orphanage: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    return staff.map((s) => ({
      id: s.id,
      employeeId: s.employeeId || undefined,
      name: `${s.user.firstName} ${s.user.lastName}`,
      role: s.role,
      designation: s.designation || undefined,
      joiningDate: s.joiningDate || new Date(),
      isActive: s.isActive,
      orphanageName: s.orphanage?.name || 'Unassigned',
      userEmail: s.user.email,
      userPhone: s.user.phone || undefined,
    }));
  }

  private async getSummaryStats(
    orphanageId?: string,
    staffType?: StaffType,
  ): Promise<StaffSummaryDto> {
    const baseFilter: Prisma.OrphanageStaffWhereInput = {};

    if (staffType) {
      baseFilter.staffType = staffType;
    }

    if (orphanageId) {
      baseFilter.orphanageId = orphanageId;
    }

    const [
      total,
      active,
      administrators,
      caretakers,
      teachers,
      medicalStaff,
      securityGuards,
    ] = await Promise.all([
      this.prisma.orphanageStaff.count({ where: baseFilter }),
      this.prisma.orphanageStaff.count({
        where: { ...baseFilter, isActive: true },
      }),
      this.prisma.orphanageStaff.count({
        where: { ...baseFilter, role: OrphanageStaffRole.ADMINISTRATOR },
      }),
      this.prisma.orphanageStaff.count({
        where: { ...baseFilter, role: OrphanageStaffRole.CARETAKER },
      }),
      this.prisma.orphanageStaff.count({
        where: { ...baseFilter, role: OrphanageStaffRole.TEACHER },
      }),
      this.prisma.orphanageStaff.count({
        where: { ...baseFilter, role: OrphanageStaffRole.MEDICAL_STAFF },
      }),
      this.prisma.orphanageStaff.count({
        where: { ...baseFilter, role: OrphanageStaffRole.SECURITY_GUARD },
      }),
    ]);

    const inactive = total - active;
    const other = total - (administrators + caretakers + teachers + medicalStaff + securityGuards);

    return {
      total,
      active,
      inactive,
      administrators,
      caretakers,
      teachers,
      medicalStaff,
      securityGuards,
      other: Math.max(0, other),
    };
  }

  private async getUserOrphanageId(userId: string): Promise<string> {
    const staff = await this.prisma.orphanageStaff.findFirst({
      where: {
        userId,
        isActive: true,
        orphanageId: { not: null },
      },
      select: {
        orphanageId: true,
      },
    });

    if (staff && staff.orphanageId) {
      return staff.orphanageId;
    }

    const fallbackOrphanage = await this.prisma.orphanage.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (fallbackOrphanage) {
      return fallbackOrphanage.id;
    }

    throw new ForbiddenException(
      'User is not associated with any orphanage',
    );
  }

  private async validateOrphanageAccess(
    orphanageId: string,
    userId: string,
  ): Promise<void> {
    const userOrphanageId = await this.getUserOrphanageId(userId);
    if (orphanageId !== userOrphanageId) {
      throw new ForbiddenException(
        'You can only manage staff for your orphanage',
      );
    }
  }
}
