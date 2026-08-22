import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayload, RefreshTokenPayload } from './interfaces/jwt-payload.interface';

@ApiTags('Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─────────────────────────────────────────────
  // Register
  // ─────────────────────────────────────────────

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account. Sends an email verification link to the provided email address. Role defaults to GUEST.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registration successful — verification email sent',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          message: 'Registration successful. Please check your email to verify your account.',
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email or phone already registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  // ─────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────

  @Public()
  @SkipThrottle()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates a user and returns a JWT access token and refresh token. The refresh token should be stored securely (httpOnly cookie recommended for web clients).',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          user: {
            id: 'uuid',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'GUEST',
            isEmailVerified: true,
            isTwoFactorEnabled: false,
          },
          tokens: {
            accessToken: 'eyJhbGci...',
            refreshToken: 'eyJhbGci...',
            accessTokenExpiresAt: '2024-01-01T00:15:00.000Z',
            refreshTokenExpiresAt: '2024-01-08T00:00:00.000Z',
          },
          message: 'Login successful',
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account deactivated' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  // ─────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout current session',
    description:
      'Revokes the current session. Pass the refresh token in the request body to revoke only that specific session. Omit it to revoke ALL sessions (full logout).',
  })
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser('sub') userId: string,
    @Body() dto?: RefreshTokenDto,
  ) {
    // If the client supplies a refresh token, extract its JTI to revoke only
    // that specific session. Otherwise revoke ALL sessions for the user.
    let jti: string | undefined;

    if (dto?.refreshToken) {
      try {
        // Base64-decode the payload segment to extract the JTI without re-verifying
        const payloadB64 = dto.refreshToken.split('.')[1];
        const decoded = JSON.parse(
          Buffer.from(payloadB64, 'base64url').toString('utf8'),
        );
        jti = decoded?.jti as string | undefined;
      } catch {
        // Malformed token — fall back to full logout for safety
        jti = undefined;
      }
    }

    return this.authService.logout(userId, jti);
  }

  // ─────────────────────────────────────────────
  // Logout All Sessions
  // ─────────────────────────────────────────────

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Revokes all refresh tokens for the authenticated user, invalidating all sessions across all devices.',
  })
  @ApiResponse({ status: 200, description: 'Logged out from all sessions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(@CurrentUser('sub') userId: string) {
    return this.authService.logout(userId);
  }

  // ─────────────────────────────────────────────
  // Refresh Tokens
  // ─────────────────────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiSecurity('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Issues a new access + refresh token pair using a valid refresh token. The old refresh token is revoked (token rotation). Send the refresh token in the `X-Refresh-Token` header or request body.',
  })
  @ApiHeader({
    name: 'X-Refresh-Token',
    description: 'Refresh token',
    required: false,
  })
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'New token pair issued',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          accessToken: 'eyJhbGci...',
          refreshToken: 'eyJhbGci...',
          accessTokenExpiresAt: '2024-01-01T00:15:00.000Z',
          refreshTokenExpiresAt: '2024-01-08T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshTokens(
    @CurrentUser() payload: RefreshTokenPayload & { tokenRecordId: string },
    @Req() req: Request,
  ) {
    return this.authService.refreshTokens(payload, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  // ─────────────────────────────────────────────
  // Email Verification
  // ─────────────────────────────────────────────

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description:
      'Verifies the user\'s email using the token sent in the verification email. The token expires after 24 hours.',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Resend email verification',
    description: 'Sends a new email verification link to the authenticated user\'s email address.',
  })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resendVerification(@CurrentUser('sub') userId: string) {
    return this.authService.resendVerificationEmail(userId);
  }

  // ─────────────────────────────────────────────
  // Forgot / Reset Password
  // ─────────────────────────────────────────────

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends a password reset link to the provided email address if an account exists. Always returns 200 to prevent email enumeration.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'If the account exists, a reset email has been sent',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description:
      'Resets the user\'s password using the token from the reset email. All active sessions are invalidated on success.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid/expired token or passwords do not match' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ─────────────────────────────────────────────
  // Change Password (authenticated)
  // ─────────────────────────────────────────────

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Change password (authenticated)',
    description:
      'Allows an authenticated user to change their password by providing the current password. All sessions are invalidated after the change.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password incorrect or passwords do not match' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  // ─────────────────────────────────────────────
  // OTP
  // ─────────────────────────────────────────────

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Send OTP',
    description:
      'Generates and sends a one-time password to the authenticated user\'s email (or phone). Any previous unused OTPs for the same purpose are invalidated.',
  })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP sent',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          message: 'OTP sent to john@example.com',
          expiresAt: '2024-01-01T00:10:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many OTP requests' })
  async sendOtp(
    @CurrentUser('sub') userId: string,
    @Body() dto: SendOtpDto,
  ) {
    return this.authService.sendOtp(userId, dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Verify OTP',
    description:
      'Verifies the OTP code for the given purpose. The code is invalidated after successful verification or after max attempts are exceeded.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid code or no valid OTP found' })
  @ApiResponse({ status: 429, description: 'Max attempts exceeded' })
  async verifyOtp(
    @CurrentUser('sub') userId: string,
    @Body() dto: VerifyOtpDto,
  ) {
    return this.authService.verifyOtp(userId, dto);
  }

  // ─────────────────────────────────────────────
  // Get Current User
  // ─────────────────────────────────────────────

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the profile of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: 'uuid',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'ADMIN',
          isEmailVerified: true,
          isTwoFactorEnabled: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser('sub') userId: string) {
    return this.authService.getMe(userId);
  }

  // ─────────────────────────────────────────────
  // Update Current User Profile
  // ─────────────────────────────────────────────

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates the profile of the currently authenticated user. Only firstName, lastName, and phone can be updated.',
  })
  @ApiBody({
    schema: {
      example: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: 'uuid',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: { firstName?: string; lastName?: string; phone?: string },
  ) {
    return this.authService.updateProfile(userId, dto);
  }

  // ─────────────────────────────────────────────
  // Admin — Role management
  // ─────────────────────────────────────────────

  @Get('admin/test')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: '[ADMIN] Test admin access',
    description: 'Protected route — only accessible by users with ADMIN role.',
  })
  @ApiResponse({ status: 200, description: 'Admin access confirmed' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  adminTest(@CurrentUser() user: JwtPayload) {
    return {
      message: 'Admin access confirmed',
      user: { id: user.sub, email: user.email, role: user.role },
    };
  }
}
