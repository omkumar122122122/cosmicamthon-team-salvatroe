import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'default-access-secret-CHANGE-IN-PROD',
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-CHANGE-IN-PROD',
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  emailVerification: {
    expiryHours: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY_HOURS || '24', 10),
  },
  passwordReset: {
    expiryHours: parseInt(process.env.PASSWORD_RESET_EXPIRY_HOURS || '1', 10),
  },
}));
