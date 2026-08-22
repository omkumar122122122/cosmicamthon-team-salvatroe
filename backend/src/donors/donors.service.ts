import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../auth/services/token.service';
import { DonorRegisterDto } from './dto/donor-register.dto';
import { DonorLoginDto } from './dto/donor-login.dto';
import { CreateDonationDto } from './dto/create-donation.dto';
import { Role } from '../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DonorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: DonorRegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and Confirm Password do not match');
    }

    const emailNormalized = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: emailNormalized, mode: 'insensitive' } },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const existingDonor = await this.prisma.donor.findUnique({
      where: { email: emailNormalized },
    });
    if (existingDonor) {
      throw new ConflictException('A donor account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const nameParts = dto.fullName.trim().split(' ');
    const firstName = nameParts[0] || 'Donor';
    const lastName = nameParts.slice(1).join(' ') || '';

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: emailNormalized,
          password: hashedPassword,
          firstName,
          lastName,
          phone: dto.mobileNumber,
          role: Role.DONOR,
          isEmailVerified: true,
          isActive: true,
        },
      });

      const donor = await tx.donor.create({
        data: {
          userId: user.id,
          fullName: dto.fullName.trim(),
          email: emailNormalized,
          mobileNumber: dto.mobileNumber,
          address: dto.address,
          city: dto.city,
          password: hashedPassword,
        },
      });

      return { user, donor };
    });

    const tokens = await this.tokenService.generateTokenPair(
      result.user.id,
      result.user.email,
      Role.DONOR,
    );

    return {
      message: 'Donor registration successful',
      user: {
        id: result.user.id,
        donorId: result.donor.id,
        fullName: result.donor.fullName,
        name: result.donor.fullName,
        email: result.donor.email,
        mobileNumber: result.donor.mobileNumber,
        address: result.donor.address,
        city: result.donor.city,
        role: 'donor',
      },
      tokens,
    };
  }

  async login(dto: DonorLoginDto) {
    const emailNormalized = dto.email.toLowerCase().trim();

    // 1. Find user by email
    let user = await this.prisma.user.findFirst({
      where: {
        email: { equals: emailNormalized, mode: 'insensitive' },
      },
      include: { donorProfile: true },
    });

    let donor = user?.donorProfile;

    // 2. If not linked or user missing, lookup Donor record directly
    if (!donor) {
      donor = await this.prisma.donor.findUnique({
        where: { email: emailNormalized },
      });
    }

    const passwordHash = user?.password || donor?.password;

    if (!donor || !passwordHash) {
      throw new UnauthorizedException('Invalid donor credentials');
    }

    const isValidPassword = await bcrypt.compare(dto.password, passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid donor credentials');
    }

    const userId = user?.id || donor.userId || donor.id;

    const tokens = await this.tokenService.generateTokenPair(
      userId,
      emailNormalized,
      Role.DONOR,
    );

    return {
      message: 'Donor login successful',
      user: {
        id: userId,
        donorId: donor.id,
        fullName: donor.fullName,
        name: donor.fullName,
        email: donor.email,
        mobileNumber: donor.mobileNumber,
        address: donor.address,
        city: donor.city,
        role: 'donor',
      },
      tokens,
    };
  }

  async getProfile(userId: string) {
    const donor = await this.prisma.donor.findFirst({
      where: {
        OR: [{ userId }, { email: userId }, { id: userId }],
      },
      include: {
        donations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!donor) {
      throw new NotFoundException('Donor profile not found');
    }

    return donor;
  }

  async createDonation(userId: string, dto: CreateDonationDto) {
    let donor = await this.prisma.donor.findFirst({
      where: {
        OR: [{ userId }, { id: userId }, { email: userId }],
      },
    });

    if (!donor) {
      throw new NotFoundException('Donor account not found');
    }

    const transactionId = `TXN-DON-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const donation = await this.prisma.donation.create({
      data: {
        donorId: donor.id,
        amount: dto.amount,
        category: dto.category,
        paymentMethod: dto.paymentMethod,
        message: dto.message || null,
        orphanageId: dto.orphanageId || null,
        transactionId,
        status: 'COMPLETED',
      },
    });

    return {
      message: 'Donation processed successfully',
      donation,
    };
  }

  async getDonations(userId: string) {
    const donor = await this.prisma.donor.findFirst({
      where: { OR: [{ userId }, { id: userId }, { email: userId }] },
    });

    if (!donor) {
      return [];
    }

    return this.prisma.donation.findMany({
      where: { donorId: donor.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(userId: string) {
    const donor = await this.prisma.donor.findFirst({
      where: { OR: [{ userId }, { id: userId }, { email: userId }] },
      include: { donations: true },
    });

    if (!donor) {
      return {
        totalDonated: 0,
        totalDonations: 0,
        impactedChildren: 0,
        supportedCauses: 0,
      };
    }

    const totalDonated = donor.donations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonations = donor.donations.length;
    const categories = new Set(donor.donations.map((d) => d.category));
    const impactedChildren = Math.floor(totalDonated / 500);

    return {
      totalDonated,
      totalDonations,
      impactedChildren: Math.max(impactedChildren, totalDonations > 0 ? 1 : 0),
      supportedCauses: categories.size,
    };
  }
}
