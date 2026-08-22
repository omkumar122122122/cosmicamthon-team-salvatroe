import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER || '',
  pass: process.env.EMAIL_PASS || '',
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Child Safety System',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@childsafety.org',
  },
}));
