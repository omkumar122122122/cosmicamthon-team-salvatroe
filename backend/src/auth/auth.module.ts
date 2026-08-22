import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './services/token.service';
import { EmailService } from './services/email.service';
import { OtpService } from './services/otp.service';

import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt-access' }),

    // Register JwtModule — secrets are loaded lazily from config
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Access token config (used as the default)
        secret: config.get<string>('jwt.accessToken.secret'),
        signOptions: { expiresIn: config.get<string>('jwt.accessToken.expiresIn', '15m') },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    // Core services
    AuthService,
    TokenService,
    EmailService,
    OtpService,

    // Passport strategies
    JwtAccessStrategy,
    JwtRefreshStrategy,
    LocalStrategy,

    // Guards (exported so other modules can use them)
    JwtAuthGuard,
    JwtRefreshGuard,
    LocalAuthGuard,
    RolesGuard,
  ],

  exports: [
    AuthService,
    TokenService,
    EmailService,
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}