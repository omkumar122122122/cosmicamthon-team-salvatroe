import {
  Injectable,
  NotFoundException,
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
  StaffListResponseDto,
  StaffProfileDto,
  CreateStaffResponseDto,
} from '../staff/dto';

@Injectable()
export class AdminStaffService {
  private readonly logger = new Logger(AdminStaffService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAdminStaff(
    dto: CreateStaffDto,
    requestUserId: string,
  ): Promise<CreateStaffResponseDto> {
    this.logger.log(`Creating Admin Staff by user: ${requestUserId}`);

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

    let targetUserId = dto.userId;

    if (!targetUserId) {
      if (!dto.email || !dto.name) {
        throw new BadRequestException(
          'Email and Name are required when creating a new staff member',
        );
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });

      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        const defaultPassword = await bcrypt.hash('AdminStaff@123', 10);
        const nameParts = dto.name.trim().split(' ');
        const firstName = nameParts[0] || 'Admin';
        const lastName = nameParts.slice(1).join(' ') || 'Staff';

        const newUser = await this.prisma.user.create({
          data: {
            email: dto.email.toLowerCase(),
            password: defaultPassword,
            firstName,
            lastName,
            role: Role.ADMIN,
            isEmailVerified: true,
            isActive: true,
          },
        });

        targetUserId = newUser.id;
      }
    }

    const existingStaff = await this.prisma.orphanageStaff.findFirst({
      where: {
        userId: targetUserId,
        staffType: StaffType.ADMIN,
        isActive: true,
      },
    });

    if (existingStaff) {
      throw new ConflictException(
        `User is already assigned as an active Admin staff member (ID: ${existingStaff.id})`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    const prismaData = {
      userId: targetUserId,
      orphanageId: null,
      staffType: StaffType.ADMIN,
      role: dto.role || OrphanageStaffRole.ADMIN,
      designation: dto.designation || 'System Admin',
      employeeId: dto.employeeId || null,
      joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      notes: dto.notes || null,
      createdBy: requestUserId || null,
      isActive: true,
    };

    console.log('Incoming DTO:', dto);
    console.log('Prisma create payload:', prismaData);

    const staff = await this.prisma.orphanageStaff.create({
      data: prismaData,
    });

    this.logger.log(`Admin staff member ${staff.id} created successfully`);

    return {
      id: staff.id,
      employeeId: staff.employeeId || undefined,
      name: `${user.firstName} ${user.lastName}`,
      role: staff.role,
      orphanageName: 'Platform Administration',
      createdAt: staff.createdAt,
    };
  }

  async findAllAdminStaff(
    queryDto: QueryStaffDto,
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

    const data = staff.map((s) => ({
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

    const [activeCount, adminCount] = await Promise.all([
      this.prisma.orphanageStaff.count({ where: { staffType: StaffType.ADMIN, isActive: true } }),
      this.prisma.orphanageStaff.count({ where: { staffType: StaffType.ADMIN, role: OrphanageStaffRole.ADMIN } }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        total,
        active: activeCount,
        inactive: total - activeCount,
        administrators: adminCount,
        caretakers: 0,
        teachers: 0,
        medicalStaff: 0,
        securityGuards: 0,
        other: 0,
      },
    };
  }

  async findOneAdminStaff(id: string): Promise<StaffProfileDto> {
    const staff = await this.prisma.orphanageStaff.findFirst({
      where: { id, staffType: StaffType.ADMIN },
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
      },
    });

    if (!staff) {
      throw new NotFoundException(`Admin staff member with ID ${id} not found`);
    }

    return {
      id: staff.id,
      employeeId: staff.employeeId || undefined,
      role: staff.role,
      designation: staff.designation || 'System Admin',
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
      orphanage: undefined,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };
  }

  async updateAdminStaff(id: string, dto: UpdateStaffDto): Promise<void> {
    const staff = await this.prisma.orphanageStaff.findFirst({
      where: { id, staffType: StaffType.ADMIN },
    });

    if (!staff) {
      throw new NotFoundException(`Admin staff member with ID ${id} not found`);
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
  }

  async deleteAdminStaff(id: string): Promise<void> {
    const staff = await this.prisma.orphanageStaff.findFirst({
      where: { id, staffType: StaffType.ADMIN },
    });

    if (!staff) {
      throw new NotFoundException(`Admin staff member with ID ${id} not found`);
    }

    await this.prisma.orphanageStaff.update({
      where: { id },
      data: {
        isActive: false,
        endDate: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async reactivateAdminStaff(id: string): Promise<void> {
    const staff = await this.prisma.orphanageStaff.findFirst({
      where: { id, staffType: StaffType.ADMIN },
    });

    if (!staff) {
      throw new NotFoundException(`Admin staff member with ID ${id} not found`);
    }

    await this.prisma.orphanageStaff.update({
      where: { id },
      data: {
        isActive: true,
        endDate: null,
        updatedAt: new Date(),
      },
    });
  }
}
