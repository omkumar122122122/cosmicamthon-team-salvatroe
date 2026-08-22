import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '999999', 10),
    lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '0', 10),
  },

  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '999999', 10),
  },

  throttle: {
    short: {
      ttl: parseInt(process.env.THROTTLE_SHORT_TTL || '1000', 10),
      limit: parseInt(process.env.THROTTLE_SHORT_LIMIT || '999999', 10),
    },
    medium: {
      ttl: parseInt(process.env.THROTTLE_MEDIUM_TTL || '10000', 10),
      limit: parseInt(process.env.THROTTLE_MEDIUM_LIMIT || '999999', 10),
    },
    long: {
      ttl: parseInt(process.env.THROTTLE_LONG_TTL || '60000', 10),
      limit: parseInt(process.env.THROTTLE_LONG_LIMIT || '999999', 10),
    },
  },
}));
