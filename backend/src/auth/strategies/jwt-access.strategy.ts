import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JWT_ACCESS_STRATEGY, TOKEN_TYPE_ACCESS } from '../../common/constants/auth.constants';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, JWT_ACCESS_STRATEGY) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessToken.secret'),
    });
  }

  /**
   * Called after passport verifies the JWT signature.
   * Validates that the user still exists, is active, and the token is an access token.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Ensure it's an access token, not a refresh token
    if (payload.type !== TOKEN_TYPE_ACCESS) {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
        passwordChangedAt: true,
        orphanageStaff: {
          where: { isActive: true },
          select: { orphanageId: true },
          take: 1,
        },
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User account is inactive or deleted');
    }

    // Detect password change after token issuance
    if (user.passwordChangedAt && payload.iat) {
      const passwordChangedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (passwordChangedTimestamp > payload.iat) {
        throw new UnauthorizedException(
          'Password has been changed. Please log in again.',
        );
      }
    }

    const orphanageId = payload.orphanageId || user.orphanageStaff?.[0]?.orphanageId || null;

    return {
      ...payload,
      orphanageId,
    };
  }
}
