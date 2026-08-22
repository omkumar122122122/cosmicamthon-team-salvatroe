import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './services/token.service';
import { EmailService } from './services/email.service';
import { OtpService } from './services/otp.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenPayload } from './interfaces/jwt-payload.interface';
import { AuthResponse, AuthenticatedUser, TokenPair } from './interfaces/auth-response.interface';
import { Role, OtpPurpose } from '../common/enums/role.enum';
import { AUDIT_ACTIONS, REVOKE_REASON_LOGOUT } from '../common/constants/auth.constants';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────
  // Register
  // ─────────────────────────────────────────────

  async register(
    dto: RegisterDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    // Normalize email to lowercase to prevent case-mismatch login issues
    const normalizedEmail = dto.email?.toLowerCase()?.trim();

    // Check email uniqueness (case-insensitive to catch any existing mixed-case entries)
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // Check phone uniqueness if provided
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('An account with this phone number already exists');
      }
    }

    // Enforce that only admins can create elevated roles (enforced at controller level too)
    const assignedRole = dto.role ?? Role.GUEST;
    const bcryptRounds = this.configService.get<number>('app.security.bcryptRounds', 12);

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, bcryptRounds);

    // Generate email verification token
    const rawToken = this.tokenService.generateSecureToken();
    const hashedToken = this.tokenService.hashToken(rawToken);
    const expiryHours = this.configService.get<number>('jwt.emailVerification.expiryHours', 24);
    const tokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        password: hashedPassword,
        role: assignedRole,
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpiry: tokenExpiry,
        passwordChangedAt: new Date(),
      },
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    this.emailService
      .sendVerificationEmail({
        to: user.email,
        firstName: user.firstName,
        token: rawToken,
      })
      .catch((err) => this.logger.error('Failed to send verification email', err as Error));

    await this.logAudit(user.id, AUDIT_ACTIONS.REGISTER, meta?.ipAddress, meta?.userAgent);

    this.logger.log(`New user registered: ${user.email} (${user.role})`);

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  // ─────────────────────────────────────────────
  // Validate Credentials (used by LocalStrategy)
  // ─────────────────────────────────────────────

  async validateCredentials(email: string, password: string) {
    // Use findFirst with mode: 'insensitive' so users who registered
    // with mixed-case emails before the lowercase fix can still log in.
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase(), mode: 'insensitive' } },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) return null;

    // Verify password
    const isMatch = user.password
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!isMatch) {
      return null;
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated. Contact support.');
    }

    // Reset failed login attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
      select: { id: true },
    });

    return user;
  }

  // ─────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────

  async login(
    dto: LoginDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthResponse> {
    const user = await this.validateCredentials(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Role-based login validation: if a role was provided by the client,
    // ensure it matches the user's actual stored role.
    if (dto.role && user.role && dto.role !== user.role) {
      throw new ForbiddenException(
        `This account is not registered as a ${dto.role}. Please select the correct role.`,
      );
    }

    // Generate token pair
    const tokens = await this.tokenService.generateTokenPair(
      user.id,
      user.email,
      user.role as Role,
      {
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent ?? dto.userAgent,
        rememberMe: dto.rememberMe,
      },
    );

    // Update last login metadata
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: meta?.ipAddress,
      },
      select: { id: true },
    });

    await this.logAudit(user.id, AUDIT_ACTIONS.LOGIN, meta?.ipAddress, meta?.userAgent, true);
    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: await this.toAuthenticatedUser(user as any),
      tokens,
      message: 'Login successful',
    };
  }

  // ─────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────

  async logout(userId: string, refreshTokenJti?: string): Promise<{ message: string }> {
    if (refreshTokenJti) {
      // Logout from current device only
      await this.tokenService.revokeRefreshToken(refreshTokenJti, REVOKE_REASON_LOGOUT);
    } else {
      // Logout from all devices
      await this.tokenService.revokeAllUserTokens(userId, REVOKE_REASON_LOGOUT);
    }

    await this.logAudit(userId, AUDIT_ACTIONS.LOGOUT);
    this.logger.log(`User logged out: ${userId}`);

    return { message: 'Logout successful' };
  }

  // ─────────────────────────────────────────────
  // Refresh Tokens
  // ─────────────────────────────────────────────

  async refreshTokens(
    payload: RefreshTokenPayload & { tokenRecordId: string },
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<TokenPair> {
    const tokens = await this.tokenService.rotateRefreshToken(
      payload.tokenRecordId,
      payload.jti,
      payload.sub,
      payload.email,
      payload.role,
      meta,
    );

    await this.logAudit(payload.sub, AUDIT_ACTIONS.REFRESH_TOKEN, meta?.ipAddress, meta?.userAgent);

    return tokens;
  }

  // ─────────────────────────────────────────────
  // Email Verification
  // ─────────────────────────────────────────────

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const hashedToken = this.tokenService.hashToken(dto.token);

    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: hashedToken },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < new Date()) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });

    // Send welcome email
    this.emailService
      .sendWelcomeEmail({ to: user.email, firstName: user.firstName })
      .catch((err) => this.logger.error('Failed to send welcome email', err as Error));

    await this.logAudit(user.id, AUDIT_ACTIONS.VERIFY_EMAIL);

    return { message: 'Email verified successfully. Welcome aboard!' };
  }

  /**
   * Resend email verification link.
   */
  async resendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    const rawToken = this.tokenService.generateSecureToken();
    const hashedToken = this.tokenService.hashToken(rawToken);
    const expiryHours = this.configService.get<number>('jwt.emailVerification.expiryHours', 24);
    const tokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpiry: tokenExpiry,
      },
    });

    await this.emailService.sendVerificationEmail({
      to: user.email,
      firstName: user.firstName,
      token: rawToken,
    });

    return { message: 'Verification email sent. Please check your inbox.' };
  }

  // ─────────────────────────────────────────────
  // Forgot Password
  // ─────────────────────────────────────────────

  async forgotPassword(
    dto: ForgotPasswordDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    // Use case-insensitive lookup so users with mixed-case emails can reset passwords
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: (dto.email || '').toLowerCase(), mode: 'insensitive' } },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.isActive || user.deletedAt) {
      return {
        message:
          'If an account with this email exists, a password reset link has been sent.',
      };
    }

    const rawToken = this.tokenService.generateSecureToken();
    const hashedToken = this.tokenService.hashToken(rawToken);
    const expiryHours = this.configService.get<number>('jwt.passwordReset.expiryHours', 1);
    const tokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetTokenExpiry: tokenExpiry,
      },
    });

    this.emailService
      .sendPasswordResetEmail({
        to: user.email,
        firstName: user.firstName,
        token: rawToken,
      })
      .catch((err) => this.logger.error('Failed to send password reset email', err as Error));

    await this.logAudit(user.id, AUDIT_ACTIONS.FORGOT_PASSWORD, meta?.ipAddress, meta?.userAgent);

    return {
      message:
        'If an account with this email exists, a password reset link has been sent.',
    };
  }

  // ─────────────────────────────────────────────
  // Reset Password
  // ─────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashedToken = this.tokenService.hashToken(dto.token);

    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: hashedToken },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (user.passwordResetTokenExpiry && user.passwordResetTokenExpiry < new Date()) {
      throw new BadRequestException(
        'Password reset token has expired. Please request a new one.',
      );
    }

    const bcryptRounds = this.configService.get<number>('app.security.bcryptRounds', 12);
    const hashedPassword = await bcrypt.hash(dto.newPassword, bcryptRounds);

    // Update password and clear token; revoke all sessions for security
    await Promise.all([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
          passwordChangedAt: new Date(),
          loginAttempts: 0,
          lockedUntil: null,
        },
      }),
      this.tokenService.revokeAllUserTokens(user.id, 'SECURITY'),
    ]);

    await this.logAudit(user.id, AUDIT_ACTIONS.RESET_PASSWORD);
    this.logger.log(`Password reset for user: ${user.email}`);

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  // ─────────────────────────────────────────────
  // Change Password (authenticated)
  // ─────────────────────────────────────────────

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const isMatch = user.password
      ? await bcrypt.compare(dto.currentPassword, user.password)
      : false;

    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const bcryptRounds = this.configService.get<number>('app.security.bcryptRounds', 12);
    const hashedPassword = await bcrypt.hash(dto.newPassword, bcryptRounds);

    await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword, passwordChangedAt: new Date() },
      }),
      this.tokenService.revokeAllUserTokens(userId, 'SECURITY'),
    ]);

    await this.logAudit(userId, AUDIT_ACTIONS.PASSWORD_CHANGED);

    return {
      message: 'Password changed successfully. All sessions have been invalidated.',
    };
  }

  // ─────────────────────────────────────────────
  // OTP
  // ─────────────────────────────────────────────

  async sendOtp(
    userId: string,
    dto: SendOtpDto,
  ): Promise<{ message: string; expiresAt: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const result = await this.otpService.sendOtp({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      purpose: dto.purpose,
      phone: dto.phone,
    });

    await this.logAudit(userId, AUDIT_ACTIONS.SEND_OTP);

    return result;
  }

  async verifyOtp(
    userId: string,
    dto: VerifyOtpDto,
  ): Promise<{ message: string }> {
    await this.otpService.verifyOtp({
      userId,
      code: dto.code,
      purpose: dto.purpose,
    });

    // If verifying for email verification purpose, mark email as verified
    if (dto.purpose === OtpPurpose.EMAIL_VERIFICATION) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true },
      });
    }

    await this.logAudit(userId, AUDIT_ACTIONS.VERIFY_OTP);

    return { message: 'OTP verified successfully' };
  }

  // ─────────────────────────────────────────────
  // Get Current User Profile
  // ─────────────────────────────────────────────

  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
        avatar: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        orphanageStaff: {
          where: { isActive: true },
          select: { orphanageId: true },
          take: 1,
        },
      },
    });

    if (!user || !(user as any).isActive) {
      throw new NotFoundException('User not found');
    }

    return await this.toAuthenticatedUser(user as any);
  }

  // ─────────────────────────────────────────────
  // Update Current User Profile
  // ─────────────────────────────────────────────

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !(user as any).isActive) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
        avatar: true,
        phone: true,
        orphanageStaff: {
          where: { isActive: true },
          select: { orphanageId: true },
          take: 1,
        },
      },
    });

    return await this.toAuthenticatedUser(updatedUser as any);
  }

  // ─────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────

  private async toAuthenticatedUser(user: any): Promise<AuthenticatedUser> {
    let orphanageId: string | null = null;
    if (user.orphanageStaff && user.orphanageStaff.length > 0) {
      orphanageId = user.orphanageStaff[0].orphanageId;
    } else if (user.id) {
      const staff = await this.prisma.orphanageStaff.findFirst({
        where: { userId: user.id, isActive: true },
        select: { orphanageId: true },
      });
      orphanageId = staff?.orphanageId ?? null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      avatar: user.avatar ?? null,
      orphanageId,
    };
  }

  private async logAudit(
    userId: string | null,
    action: string,
    ipAddress?: string,
    userAgent?: string,
    success = true,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: { userId, action, ipAddress, userAgent, success },
      });
    } catch (err) {
      this.logger.error('Failed to write audit log', err as Error);
    }
  }
}
