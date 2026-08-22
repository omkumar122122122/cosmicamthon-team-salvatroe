import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { OtpPurpose } from '../../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // ─────────────────────────────────────────────
  // Generate & Send OTP
  // ─────────────────────────────────────────────

  async sendOtp(params: {
    userId: string;
    email: string;
    firstName: string;
    purpose: OtpPurpose;
    phone?: string;
  }): Promise<{ message: string; expiresAt: Date }> {
    const otpLength = this.configService.get<number>('app.otp.length', 6);
    const expiryMinutes = this.configService.get<number>('app.otp.expiryMinutes', 10);
    const maxAttempts = this.configService.get<number>('app.otp.maxAttempts', 5);

    // Invalidate any existing unused OTPs for this user+purpose
    await this.prisma.otpToken.updateMany({
      where: {
        userId: params.userId,
        purpose: params.purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      data: { isUsed: true, usedAt: new Date() },
    });

    // Generate plain OTP code
    const code = this.generateNumericOtp(otpLength);
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Persist hashed OTP
    await this.prisma.otpToken.create({
      data: {
        code: hashedCode,
        purpose: params.purpose,
        userId: params.userId,
        deliveredTo: params.phone ?? params.email,
        deliveryType: params.phone ? 'sms' : 'email',
        maxAttempts,
        expiresAt,
      },
    });

    // Deliver OTP via email
    await this.emailService.sendOtpEmail({
      to: params.email,
      firstName: params.firstName,
      code,
      purpose: params.purpose,
      expiryMinutes,
    });

    this.logger.log(`OTP sent to ${params.email} for purpose: ${params.purpose}`);

    return {
      message: `OTP sent to ${params.email}`,
      expiresAt,
    };
  }

  // ─────────────────────────────────────────────
  // Verify OTP
  // ─────────────────────────────────────────────

  async verifyOtp(params: {
    userId: string;
    code: string;
    purpose: OtpPurpose;
  }): Promise<boolean> {
    // Find the latest valid OTP for this user+purpose
    const otpRecord = await this.prisma.otpToken.findFirst({
      where: {
        userId: params.userId,
        purpose: params.purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException(
        'No valid OTP found. Please request a new OTP.',
      );
    }

    // Check attempt limit
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await this.prisma.otpToken.update({
        where: { id: otpRecord.id },
        data: { isUsed: true, usedAt: new Date() },
      });
      throw new HttpException(
        'Too many incorrect OTP attempts. Please request a new OTP.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment attempt counter first
    await this.prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    // Verify the code
    const isValid = await bcrypt.compare(params.code, otpRecord.code);

    if (!isValid) {
      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      throw new BadRequestException(
        `Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`,
      );
    }

    // Mark as used
    await this.prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    return true;
  }

  // ─────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────

  private generateNumericOtp(length: number): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const buffer = crypto.randomBytes(4);
    const randomNum = buffer.readUInt32BE(0);
    return String(min + (randomNum % (max - min + 1)));
  }
}
