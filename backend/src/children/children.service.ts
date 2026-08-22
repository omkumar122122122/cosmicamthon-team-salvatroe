import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import {
  CreateChildDto,
  UpdateChildDto,
  FilterChildrenDto,
  ChildProfileDto,
  ChildBasicDto,
  ChildrenListResponseDto,
  ChildrenSummaryDto,
  CreateChildResponseDto,
  ParentDetailsDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChildrenService {
  private readonly logger = new Logger(ChildrenService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateChildDto,
    photoUrl: string | null,
    userId: string,
    userRole: Role,
  ): Promise<CreateChildResponseDto> {
    // For ORPHANAGE users, auto-assign orphanage based on their staff record
    if (userRole === Role.ORPHANAGE) {
      if (!dto.orphanageId) {
        dto.orphanageId = await this.getUserOrphanageId(userId);
      } else {
        await this.validateOrphanageAccess(dto.orphanageId, userId);
      }
    }
    // For ADMIN users, validate orphanage exists if provided

    if (dto.orphanageId) {
      const orphanage = await this.prisma.orphanage.findUnique({
        where: { id: dto.orphanageId },
      });
      if (!orphanage) {
        throw new NotFoundException(`Orphanage with ID ${dto.orphanageId} not found`);
      }
    }

    const childCode = await this.generateChildCode();

    let age = dto.approximateAge;
    if (dto.dateOfBirth) {
      const dob = new Date(dto.dateOfBirth);
      age = this.calculateAge(dob);
    }

    const child = await this.prisma.child.create({
      data: {
        childCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        approximateAge: age,
        gender: dto.gender || 'UNKNOWN',
        nationality: dto.nationality || 'Indian',
        religion: dto.religion,
        motherTongue: dto.motherTongue,
        caste: dto.caste,
        height: dto.height,
        weight: dto.weight,
        bloodGroup: dto.bloodGroup || 'UNKNOWN',
        skinTone: dto.skinTone,
        eyeColor: dto.eyeColor,
        hairColor: dto.hairColor,
        distinguishingMarks: dto.distinguishingMarks,
        aadhaarNumber: dto.aadhaarNumber,
        birthCertNumber: dto.birthCertNumber,
        photo: photoUrl,
        healthStatus: dto.healthStatus || 'UNKNOWN',
        hasDisability: dto.hasDisability || false,
        disabilityDetails: dto.disabilityDetails,
        hasChronicCondition: dto.hasChronicCondition || false,
        chronicConditionDetails: dto.chronicConditionDetails,
        isVaccinationComplete: dto.isVaccinationComplete || false,
        currentStatus: dto.currentStatus || 'REGISTERED',
        adoptionStatus: 'NOT_INITIATED',
        isAdoptable: dto.isAdoptable || false,
        admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : new Date(),
        admissionReason: dto.admissionReason,
        entrySource: dto.entrySource,
        referredBy: dto.referredBy,
        fatherName: dto.fatherName,
        fatherStatus: dto.fatherStatus as any,
        motherName: dto.motherName,
        motherStatus: dto.motherStatus as any,
        parentsMaritalStatus: dto.parentsMaritalStatus as any,
        familyBackground: dto.familyBackground,
        foundLocation: dto.foundLocation,
        foundDistrict: dto.foundDistrict,
        foundState: dto.foundState,
        specialNotes: dto.specialNotes,
        internalNotes: dto.internalNotes,
        orphanageId: dto.orphanageId,
        isActive: true,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    this.logger.log(`Child ${childCode} registered by user ${userId}`);

    return {
      id: child.id,
      childCode: child.childCode,
      name: `${child.firstName} ${child.lastName || ''}`.trim(),
      registeredBy: user ? `${user.firstName} ${user.lastName}` : 'System',
      createdAt: child.createdAt,
    };
  }

  async findAll(
    filterDto: FilterChildrenDto,
    userId: string,
    userRole: Role,
  ): Promise<ChildrenListResponseDto> {
    const { 
      search, 
      orphanageId, 
      risk, 
      status, 
      adoptionStatus, 
      page = 1, 
      limit = 8, 
      sortBy = 'admissionDate', 
      sortOrder = 'desc' 
    } = filterDto;

    const andConditions: Prisma.ChildWhereInput[] = [
      { deletedAt: null },
      { isActive: true },
    ];

    if (userRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(userId);
      andConditions.push({ orphanageId: userOrphanageId });
    } else if (orphanageId) {
      andConditions.push({ orphanageId });
    }

    if (search) {
      andConditions.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { childCode: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (status) {
      andConditions.push({ currentStatus: status });
    }
    if (adoptionStatus) {
      andConditions.push({ adoptionStatus });
    }

    const where: Prisma.ChildWhereInput = {
      AND: andConditions,
    };

    const skip = (page - 1) * limit;
    const take = limit;

    const total = await this.prisma.child.count({ where });

    const orderByField = sortBy as keyof Prisma.ChildOrderByWithRelationInput;
    const children = await this.prisma.child.findMany({
      where,
      include: {
        orphanage: {
          select: {
            id: true,
            name: true,
          },
        },
        attendanceRecords: {
          where: {
            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          select: {
            status: true,
          },
        },
      },
      orderBy: { [orderByField]: sortOrder },
      skip,
      take,
    });

    const data: ChildBasicDto[] = children.map((child) => {
      const age = child.dateOfBirth
        ? this.calculateAge(child.dateOfBirth)
        : child.approximateAge || 0;

      const attendance = this.calculateAttendancePercentage(child.attendanceRecords);

      // Calculate risk based on health status and attendance
      const calcRisk = child.healthStatus === 'CRITICAL' || child.healthStatus === 'UNDER_TREATMENT'
        ? 'High'
        : child.healthStatus === 'CHRONIC_CONDITION' || attendance < 75
          ? 'Medium'
          : 'Low';

      return {
        id: child.id,
        childCode: child.childCode,
        name: `${child.firstName} ${child.lastName || ''}`.trim(),
        age,
        orphanage: child.orphanage?.name || 'Unknown',
        risk: calcRisk,
        health: child.healthStatus,
        attendance,
        photo: child.photo,
      };
    });

    const summary = await this.getSummaryStats(
      userRole === Role.ORPHANAGE ? await this.getUserOrphanageId(userId) : undefined,
    );

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

  async findOne(id: string, userId: string, userRole: Role): Promise<ChildProfileDto> {
    const child = await this.prisma.child.findUnique({
      where: { id },
      include: {
        orphanage: {
          select: {
            id: true,
            name: true,
          },
        },
        attendanceRecords: {
          where: {
            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          select: {
            status: true,
          },
        },
        adoptionRecord: {
          include: {
            adoptiveParent: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
                addresses: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        guardianHistories: {
          where: { isCurrent: true },
          take: 1,
        },
        assignedCaseworker: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        educationRecords: {
          where: { isCurrent: true },
          take: 1,
        },
        medicalHistories: {
          where: { isCurrent: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!child || child.deletedAt) {
      throw new NotFoundException(`Child with ID ${id} not found`);
    }

    if (userRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(userId);
      if (child.orphanageId !== userOrphanageId) {
        throw new ForbiddenException('You do not have access to this child');
      }
    }

    const age = child.dateOfBirth
      ? this.calculateAge(child.dateOfBirth)
      : child.approximateAge || 0;

    const attendance = this.calculateAttendancePercentage(child.attendanceRecords);

    const educationLevel = child.educationRecords[0]?.level || 'NOT_ENROLLED';

    const caseWorker = child.assignedCaseworker
      ? `${child.assignedCaseworker.firstName} ${child.assignedCaseworker.lastName}`
      : 'Not Assigned';

    const medicalHistory = child.medicalHistories
      .map((h) => h.conditionName)
      .join(', ') || 'None';

    const vaccinationStatus = child.isVaccinationComplete ? 'Complete' : 'Incomplete';

    let parentDetails: ParentDetailsDto | null = null;
    if (child.adoptionRecord?.adoptiveParent) {
      const parent = child.adoptionRecord.adoptiveParent;
      const address = parent.addresses[0];
      const guardian = child.guardianHistories[0];

      parentDetails = {
        id: parent.id,
        fatherName: parent.user.firstName || 'Unknown',
        motherName: parent.spouseName || 'Unknown',
        fatherPhone: parent.user.phone || '',
        motherPhone: parent.alternatePhone || '',
        email: parent.user.email,
        address: address
          ? `${address.addressLine1}, ${address.city}, ${address.state}`
          : 'Not provided',
        adoptionOrderId: child.adoptionRecord.courtCaseNumber || 'Pending',
        followUpOfficer: guardian?.guardianName || 'Not assigned',
      };
    }

    // Calculate risk based on health status and attendance
    const profileRisk = child.healthStatus === 'CRITICAL' || child.healthStatus === 'UNDER_TREATMENT'
      ? 'High'
      : child.healthStatus === 'CHRONIC_CONDITION' || attendance < 75
        ? 'Medium'
        : 'Low';

    return {
      id: child.id,
      childCode: child.childCode,
      name: `${child.firstName} ${child.lastName || ''}`.trim(),
      age,
      gender: child.gender,
      bloodGroup: child.bloodGroup,
      orphanage: {
        id: child.orphanage?.id || '',
        name: child.orphanage?.name || 'Unknown',
      },
      admissionDate: child.admissionDate,
      foundCondition: child.entrySource || 'Unknown',
      foundLocation: child.foundLocation || 'Unknown',
      risk: profileRisk,
      health: child.healthStatus,
      attendance,
      educationLevel,
      caseWorker,
      vaccinationStatus,
      allergies: child.chronicConditionDetails || 'None',
      medicalHistory,
      medicalHistoryFile: undefined,
      photo: child.photo || undefined,
      adopted: child.adoptionStatus === 'COMPLETED',
      adoptionDate: child.adoptionRecord?.completedDate || undefined,
      emergencyContact: child.guardianHistories[0]?.contactPhone || 'Not provided',
      parentDetails: parentDetails || undefined,
    };
  }

  async update(id: string, dto: UpdateChildDto, userId: string, userRole: Role): Promise<void> {
    const child = await this.prisma.child.findUnique({
      where: { id },
    });

    if (!child || child.deletedAt) {
      throw new NotFoundException(`Child with ID ${id} not found`);
    }

    if (userRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(userId);
      if (child.orphanageId !== userOrphanageId) {
        throw new ForbiddenException('You do not have access to update this child');
      }
    }

    await this.prisma.child.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        approximateAge: dto.approximateAge,
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        healthStatus: dto.healthStatus,
        hasDisability: dto.hasDisability,
        disabilityDetails: dto.disabilityDetails,
        hasChronicCondition: dto.hasChronicCondition,
        chronicConditionDetails: dto.chronicConditionDetails,
        specialNotes: dto.specialNotes,
      },
    });

    this.logger.log(`Child ${id} updated by user ${userId}`);
  }

  async remove(id: string, userId: string): Promise<void> {
    const child = await this.prisma.child.findUnique({
      where: { id },
    });

    if (!child || child.deletedAt) {
      throw new NotFoundException(`Child with ID ${id} not found`);
    }

    await this.prisma.child.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    this.logger.log(`Child ${id} soft deleted by user ${userId}`);
  }

  async getRecentChildren(limit: number = 5, userId: string, userRole: Role): Promise<ChildBasicDto[]> {
    const takeCount = Number(limit) && !isNaN(Number(limit)) ? Number(limit) : 5;
    const where: Prisma.ChildWhereInput = {
      deletedAt: null,
      isActive: true,
    };

    if (userRole === Role.ORPHANAGE) {
      const userOrphanageId = await this.getUserOrphanageId(userId);
      where.orphanageId = userOrphanageId;
    }

    const children = await this.prisma.child.findMany({
      where,
      include: {
        orphanage: {
          select: {
            name: true,
          },
        },
        attendanceRecords: {
          where: {
            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: takeCount,
    });

    return children.map((child) => {
      const attendance = this.calculateAttendancePercentage(child.attendanceRecords);
      const calcRisk = child.healthStatus === 'CRITICAL' || child.healthStatus === 'UNDER_TREATMENT'
        ? 'High'
        : child.healthStatus === 'CHRONIC_CONDITION' || attendance < 75
          ? 'Medium'
          : 'Low';
      return {
        id: child.id,
        childCode: child.childCode,
        name: `${child.firstName} ${child.lastName || ''}`.trim(),
        age: child.dateOfBirth ? this.calculateAge(child.dateOfBirth) : child.approximateAge || 0,
        orphanage: child.orphanage?.name || 'Unknown',
        risk: calcRisk,
        health: child.healthStatus,
        attendance,
        photo: child.photo,
      };
    });
  }

  async getSummaryStats(orphanageId?: string): Promise<ChildrenSummaryDto> {
    const baseFilter: Prisma.ChildWhereInput = {
      deletedAt: null,
      isActive: true,
    };

    if (orphanageId) {
      baseFilter.orphanageId = orphanageId;
    }

    const [total, highRisk, adopted, needsReview] = await Promise.all([
      this.prisma.child.count({ where: baseFilter }),
      this.prisma.child.count({
        where: {
          ...baseFilter,
          OR: [
            { healthStatus: 'CRITICAL' },
            { healthStatus: 'UNDER_TREATMENT' },
          ],
        },
      }),
      this.prisma.child.count({
        where: { ...baseFilter, adoptionStatus: 'COMPLETED' },
      }),
      this.prisma.child.count({
        where: {
          ...baseFilter,
          healthStatus: { in: ['UNDER_TREATMENT', 'CRITICAL'] },
        },
      }),
    ]);

    return {
      total,
      highRisk,
      adopted,
      needsReview,
    };
  }

  private async generateChildCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.child.count({
      where: {
        childCode: {
          startsWith: `CHD-${year}-`,
        },
      },
    });

    const sequence = String(count + 1).padStart(6, '0');
    return `CHD-${year}-${sequence}`;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private calculateAttendancePercentage(
    records: Array<{ status: string }>,
  ): number {
    if (records.length === 0) return 0;
    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    return Math.round((presentCount / records.length) * 100);
  }

  private async getUserOrphanageId(userId: string): Promise<string> {
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

    const fallbackOrphanage = await this.prisma.orphanage.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (fallbackOrphanage) {
      return fallbackOrphanage.id;
    }

    throw new ForbiddenException('User is not associated with any orphanage');
  }

  private async validateOrphanageAccess(orphanageId: string, userId: string): Promise<void> {
    const userOrphanageId = await this.getUserOrphanageId(userId);
    if (orphanageId !== userOrphanageId) {
      throw new ForbiddenException('You can only register children for your orphanage');
    }
  }
}
