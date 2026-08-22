import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, RefreshTokenPayload } from '../interfaces/jwt-payload.interface';
import { TokenPair } from '../interfaces/auth-response.interface';
import { Role } from '../../common/enums/role.enum';
import {
  TOKEN_TYPE_ACCESS,
  TOKEN_TYPE_REFRESH,
  REVOKE_REASON_LOGOUT,
  REVOKE_REASON_ROTATION,
} from '../../common/constants/auth.constants';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ─────────────────────────────────────────────
  // Token Generation
  // ─────────────────────────────────────────────

  /**
   * Generates a new access + refresh token pair and persists
   * the hashed refresh token to the database.
   */
  async generateTokenPair(
    userId: string,
    email: string,
    role: Role,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      rememberMe?: boolean;
      parentJti?: string;
    },
  ): Promise<TokenPair> {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const accessConfig = this.configService.get('jwt.accessToken');
    const refreshConfig = this.configService.get('jwt.refreshToken');

    // Extend refresh TTL for "remember me"
    const refreshExpiresIn = options?.rememberMe ? '30d' : refreshConfig.expiresIn;

    // Look up user's active orphanage ID if associated (direct orphanage or staff)
    let orphanageId: string | null = null;
    const orphanage = await this.prisma.orphanage.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (orphanage) {
      orphanageId = orphanage.id;
    } else {
      const staffRecord = await this.prisma.orphanageStaff.findFirst({
        where: { userId, isActive: true },
        select: { orphanageId: true },
      });
      orphanageId = staffRecord?.orphanageId ?? null;
    }

    // Build payloads
    const accessPayload: JwtPayload = {
      sub: userId,
      userId,
      email,
      role,
      ...(orphanageId && { orphanageId }),
      type: TOKEN_TYPE_ACCESS,
      jti: accessJti,
      orphanageId,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      userId,
      email,
      role,
      ...(orphanageId && { orphanageId }),
      type: TOKEN_TYPE_REFRESH,
      jti: refreshJti,
      orphanageId,
      parentJti: options?.parentJti,
    };

    // Sign both tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessConfig.secret,
        expiresIn: accessConfig.expiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshConfig.secret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    // Calculate expiry dates
    const accessExpiresMs = this.parseExpiryToMs(accessConfig.expiresIn);
    const refreshExpiresMs = this.parseExpiryToMs(refreshExpiresIn);
    const now = Date.now();

    const accessTokenExpiresAt = new Date(now + accessExpiresMs);
    const refreshTokenExpiresAt = new Date(now + refreshExpiresMs);

    // Hash refresh token before storing
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // Persist refresh token
    await this.prisma.refreshToken.create({
      data: {
        jti: refreshJti,
        token: hashedRefreshToken,
        userId,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        deviceId: options?.deviceId,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  /**
   * Rotates a refresh token — revokes the old one and issues a new pair.
   * Implements token rotation to limit the window of refresh token theft.
   */
  async rotateRefreshToken(
    oldTokenRecordId: string,
    oldJti: string,
    userId: string,
    email: string,
    role: Role,
    options?: { ipAddress?: string; userAgent?: string },
  ): Promise<TokenPair> {
    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: oldTokenRecordId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: REVOKE_REASON_ROTATION,
      },
    });

    // Issue new pair, linking parentJti for family tracking
    return this.generateTokenPair(userId, email, role, {
      ...options,
      parentJti: oldJti,
    });
  }

  // ─────────────────────────────────────────────
  // Token Revocation
  // ─────────────────────────────────────────────

  /**
   * Revokes a single refresh token (logout from current device).
   */
  async revokeRefreshToken(jti: string, reason = REVOKE_REASON_LOGOUT): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { jti, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
    });
  }

  /**
   * Revokes all refresh tokens for a user (logout from all devices).
   */
  async revokeAllUserTokens(userId: string, reason = REVOKE_REASON_LOGOUT): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
    });
  }

  // ─────────────────────────────────────────────
  // Secure Random Token Helpers
  // ─────────────────────────────────────────────

  /**
   * Generates a cryptographically secure random token (for email verification / password reset).
   */
  generateSecureToken(lengthBytes = 32): string {
    return crypto.randomBytes(lengthBytes).toString('hex');
  }

  /**
   * Hashes a raw token with SHA-256 for safe DB storage.
   * The raw token is sent to the user; only the hash is persisted.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // ─────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────

  private parseExpiryToMs(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] ?? 1000);
  }
}
