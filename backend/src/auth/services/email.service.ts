import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OtpPurpose } from '../../common/enums/role.enum';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const emailConfig = this.configService.get('email');
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });
  }

  // ─────────────────────────────────────────────
  // Core send method
  // ─────────────────────────────────────────────

  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    const emailConfig = this.configService.get('email');

    try {
      await this.transporter.sendMail({
        from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text ?? options.html.replace(/<[^>]*>/g, ''),
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error.stack);
      throw new InternalServerErrorException('Failed to send email. Please try again later.');
    }
  }

  // ─────────────────────────────────────────────
  // Email verification
  // ─────────────────────────────────────────────

  async sendVerificationEmail(params: {
    to: string;
    firstName: string;
    token: string;
  }): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${params.token}`;

    await this.sendMail({
      to: params.to,
      subject: 'Verify Your Email — Child Safety System',
      html: this.emailVerificationTemplate({
        firstName: params.firstName,
        verifyUrl,
        expiryHours: this.configService.get<number>('jwt.emailVerification.expiryHours', 24),
      }),
    });
  }

  // ─────────────────────────────────────────────
  // Password reset
  // ─────────────────────────────────────────────

  async sendPasswordResetEmail(params: {
    to: string;
    firstName: string;
    token: string;
  }): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${params.token}`;

    await this.sendMail({
      to: params.to,
      subject: 'Reset Your Password — Child Safety System',
      html: this.passwordResetTemplate({
        firstName: params.firstName,
        resetUrl,
        expiryHours: this.configService.get<number>('jwt.passwordReset.expiryHours', 1),
      }),
    });
  }

  // ─────────────────────────────────────────────
  // OTP delivery
  // ─────────────────────────────────────────────

  async sendOtpEmail(params: {
    to: string;
    firstName: string;
    code: string;
    purpose: OtpPurpose;
    expiryMinutes: number;
  }): Promise<void> {
    const purposeLabels: Record<OtpPurpose, string> = {
      [OtpPurpose.EMAIL_VERIFICATION]: 'Email Verification',
      [OtpPurpose.PHONE_VERIFICATION]: 'Phone Verification',
      [OtpPurpose.TWO_FACTOR_AUTH]: 'Two-Factor Authentication',
      [OtpPurpose.PASSWORD_RESET]: 'Password Reset',
      [OtpPurpose.SENSITIVE_ACTION]: 'Sensitive Action Confirmation',
    };

    await this.sendMail({
      to: params.to,
      subject: `Your OTP Code — ${purposeLabels[params.purpose]}`,
      html: this.otpTemplate({
        firstName: params.firstName,
        code: params.code,
        purpose: purposeLabels[params.purpose],
        expiryMinutes: params.expiryMinutes,
      }),
    });
  }

  // ─────────────────────────────────────────────
  // Welcome email
  // ─────────────────────────────────────────────

  async sendWelcomeEmail(params: { to: string; firstName: string }): Promise<void> {
    await this.sendMail({
      to: params.to,
      subject: 'Welcome to Child Safety System',
      html: this.welcomeTemplate({ firstName: params.firstName }),
    });
  }

  // ─────────────────────────────────────────────
  // HTML Templates
  // ─────────────────────────────────────────────

  private baseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Child Safety System</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#1a56db;padding:30px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">
                🛡️ Child Safety System
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#6c757d;font-size:12px;">
                This email was sent by the Orphan Age Child Safety System.<br>
                If you didn't request this, please ignore this email or
                <a href="mailto:support@childsafety.org" style="color:#1a56db;">contact support</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private emailVerificationTemplate(params: {
    firstName: string;
    verifyUrl: string;
    expiryHours: number;
  }): string {
    return this.baseTemplate(`
      <h2 style="color:#1a202c;margin:0 0 16px;">Hello, ${params.firstName}!</h2>
      <p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">
        Thank you for registering with the Child Safety System. Please verify your email address
        to activate your account and access all features.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${params.verifyUrl}"
           style="background:#1a56db;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:600;font-size:16px;display:inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color:#718096;font-size:14px;margin:0 0 8px;">
        Or copy and paste this link into your browser:
      </p>
      <p style="color:#1a56db;font-size:13px;word-break:break-all;margin:0 0 24px;">
        ${params.verifyUrl}
      </p>
      <p style="color:#e53e3e;font-size:13px;margin:0;">
        ⏳ This link expires in <strong>${params.expiryHours} hours</strong>.
      </p>
    `);
  }

  private passwordResetTemplate(params: {
    firstName: string;
    resetUrl: string;
    expiryHours: number;
  }): string {
    return this.baseTemplate(`
      <h2 style="color:#1a202c;margin:0 0 16px;">Password Reset Request</h2>
      <p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">
        Hi <strong>${params.firstName}</strong>, we received a request to reset the password for your account.
        Click the button below to set a new password.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${params.resetUrl}"
           style="background:#e53e3e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:600;font-size:16px;display:inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color:#718096;font-size:14px;margin:0 0 8px;">
        Or copy and paste this link into your browser:
      </p>
      <p style="color:#1a56db;font-size:13px;word-break:break-all;margin:0 0 24px;">
        ${params.resetUrl}
      </p>
      <p style="color:#e53e3e;font-size:13px;margin:0;">
        ⏳ This link expires in <strong>${params.expiryHours} hour(s)</strong>.
      </p>
      <p style="color:#718096;font-size:13px;margin:16px 0 0;">
        If you did not request a password reset, please ignore this email. Your password will remain unchanged.
      </p>
    `);
  }

  private otpTemplate(params: {
    firstName: string;
    code: string;
    purpose: string;
    expiryMinutes: number;
  }): string {
    return this.baseTemplate(`
      <h2 style="color:#1a202c;margin:0 0 16px;">Your OTP Code</h2>
      <p style="color:#4a5568;line-height:1.6;margin:0 0 8px;">
        Hi <strong>${params.firstName}</strong>, here is your one-time password for
        <strong>${params.purpose}</strong>:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <div style="background:#f7fafc;border:2px dashed #1a56db;border-radius:8px;padding:24px;display:inline-block;">
          <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#1a56db;font-family:monospace;">
            ${params.code}
          </span>
        </div>
      </div>
      <p style="color:#e53e3e;font-size:13px;text-align:center;margin:0 0 16px;">
        ⏳ Expires in <strong>${params.expiryMinutes} minutes</strong>
      </p>
      <p style="color:#718096;font-size:13px;margin:0;">
        Never share this code with anyone. Our team will never ask for your OTP.
      </p>
    `);
  }

  private welcomeTemplate(params: { firstName: string }): string {
    return this.baseTemplate(`
      <h2 style="color:#1a202c;margin:0 0 16px;">Welcome, ${params.firstName}! 🎉</h2>
      <p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">
        Your account has been successfully created and verified on the
        <strong>Orphan Age Child Safety System</strong>. You're now part of our mission to
        protect and support children.
      </p>
      <p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">
        If you have any questions or need assistance, please reach out to our support team at
        <a href="mailto:support@childsafety.org" style="color:#1a56db;">support@childsafety.org</a>.
      </p>
      <p style="color:#2d3748;font-weight:600;margin:0;">
        — The Child Safety Team
      </p>
    `);
  }
}
