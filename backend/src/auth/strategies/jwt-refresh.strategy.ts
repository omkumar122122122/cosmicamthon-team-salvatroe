import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshTokenPayload } from '../interfaces/jwt-payload.interface';
import {
  JWT_REFRESH_STRATEGY,
  TOKEN_TYPE_REFRESH,
  REFRESH_TOKEN_HEADER,
} from '../../common/constants/auth.constants';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, JWT_REFRESH_STRATEGY) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Accept refresh token from X-Refresh-Token header OR Authorization Bearer
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.headers?.[REFRESH_TOKEN_HEADER] as string ?? null,
        ExtractJwt.fromBodyField('refreshToken'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshToken.secret'),
      passReqToCallback: true,
    });
  }

  /**
   * Validates the refresh token against the database record.
   * Implements token rotation detection — if a revoked token is reused,
   * all tokens for that user are revoked (token family compromise).
   */
  async validate(req: Request, payload: RefreshTokenPayload): Promise<RefreshTokenPayload> {
    if (payload.type !== TOKEN_TYPE_REFRESH) {
      throw new UnauthorizedException('Invalid token type');
    }

    // Extract raw token from request
    const rawToken =
      (req?.headers?.[REFRESH_TOKEN_HEADER] as string) ??
      req?.body?.refreshToken ??
      ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (!rawToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    // Find the refresh token record by JTI
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
      include: {
        user: {
          select: { id: true, isActive: true, deletedAt: true },
        },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Token reuse detection — if already revoked, invalidate entire family
    if (tokenRecord.isRevoked) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date(), revokedReason: 'SECURITY' },
      });
      throw new UnauthorizedException(
        'Refresh token reuse detected. All sessions have been invalidated.',
      );
    }

    // Check expiry
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true, revokedAt: new Date(), revokedReason: 'EXPIRED' },
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Verify hashed token
    const isValid = await bcrypt.compare(rawToken, tokenRecord.token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check user is still active
    if (!tokenRecord.user.isActive || tokenRecord.user.deletedAt) {
      throw new UnauthorizedException('User account is inactive or deleted');
    }

    // Attach tokenRecord id to payload so the service can rotate it
    (payload as any).tokenRecordId = tokenRecord.id;

    return payload;
  }
}
