import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChildGender, BloodGroup, HealthStatus } from '@prisma/client';

export interface IChildQueryDto {
  search?: string;
  gender?: ChildGender;
  bloodGroup?: BloodGroup;
  healthStatus?: HealthStatus;
  orphanageId?: string;
  ageMin?: number;
  ageMax?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ChildSearchFilterService {
  private readonly logger = new Logger(ChildSearchFilterService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search and filter children with pagination and detailed relation includes.
   */
  async searchAndFilterChildren(query: IChildQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : { isActive: true }),
    };

    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { childCode: { contains: q, mode: 'insensitive' } },
        { aadhaarNumber: { contains: q } },
      ];
    }

    if (query.gender) where.gender = query.gender;
    if (query.bloodGroup) where.bloodGroup = query.bloodGroup;
    if (query.healthStatus) where.healthStatus = query.healthStatus;
    if (query.orphanageId) where.orphanageId = query.orphanageId;

    if (query.ageMin !== undefined || query.ageMax !== undefined) {
      where.approximateAge = {};
      if (query.ageMin !== undefined) where.approximateAge.gte = Number(query.ageMin);
      if (query.ageMax !== undefined) where.approximateAge.lte = Number(query.ageMax);
    }

    const orderByField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [total, children] = await Promise.all([
      this.prisma.child.count({ where }),
      this.prisma.child.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
        include: {
          orphanage: {
            select: {
              id: true,
              code: true,
              name: true,
              city: true,
            },
          },
          biometricData: {
            where: { isActive: true },
            select: {
              id: true,
              type: true,
              quality: true,
            },
          },
        },
      }),
    ]);

    const formattedData = children.map((c) => {
      const isEnrolled = c.biometricData.some((b) => b.type === 'FACE_RECOGNITION');
      return {
        ...c,
        fullName: `${c.firstName} ${c.lastName || ''}`.trim(),
        aiEnrollmentStatus: isEnrolled ? 'Completed' : 'Pending',
        faceVerified: isEnrolled,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      statusCode: 200,
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
