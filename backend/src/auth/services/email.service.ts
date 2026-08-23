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
  // NFC Visit Pass Notification
  // ─────────────────────────────────────────────

  async sendNfcVisitPassEmail(params: {
    to: string;
    parentName: string;
    orphanageName: string;
    visitDate: string;
    visitTime: string;
    nfcId: string;
    nfcUrl: string;
    meetingRoom?: string;
    assignedStaff?: string;
    instructions?: string;
  }): Promise<void> {
    await this.sendMail({
      to: params.to,
      subject: `Visit Request Accepted — Your NFC Digital Pass [${params.nfcId}]`,
      html: this.nfcVisitPassTemplate(params),
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

  private nfcVisitPassTemplate(params: {
    parentName: string;
    orphanageName: string;
    visitDate: string;
    visitTime: string;
    nfcId: string;
    nfcUrl: string;
    meetingRoom?: string;
    assignedStaff?: string;
    instructions?: string;
  }): string {
    return this.baseTemplate(`
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: #e0e7ff; color: #3730a3; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          NFC Digital Visit Pass Issued
        </span>
        <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 16px 0 8px;">
          Visit Request Accepted! 🎉
        </h2>
        <p style="color: #475569; font-size: 14px; margin: 0;">
          Hi <strong>${params.parentName}</strong>, your visit request to <strong>${params.orphanageName}</strong> has been officially approved.
        </p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px; color: #334155;">
          <tr>
            <td style="color: #64748b; font-weight: 600; width: 40%;">Scheduled Date:</td>
            <td style="font-weight: 700; color: #0f172a;">${params.visitDate}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600;">Time Slot:</td>
            <td style="font-weight: 700; color: #0f172a;">${params.visitTime}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600;">Meeting Room:</td>
            <td style="font-weight: 600; color: #0f172a;">${params.meetingRoom || 'Assigned upon arrival'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600;">Staff Supervisor:</td>
            <td style="font-weight: 600; color: #0f172a;">${params.assignedStaff || 'Care Staff'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600;">NFC Pass ID:</td>
            <td>
              <span style="font-family: monospace; font-size: 15px; font-weight: 800; color: #1a56db; background: #eff6ff; padding: 3px 8px; border-radius: 6px; border: 1px solid #bfdbfe;">
                ${params.nfcId}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background: #eff6ff; border: 1px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <h3 style="color: #1e40af; font-size: 15px; font-weight: 700; margin: 0 0 8px;">
          📲 NFC Pass & Entry QR Code
        </h3>
        <p style="color: #1e3a8a; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
          Present this QR code or tap your device at the orphanage security gate for instant check-in.
        </p>

        <!-- Embedded QR Code for Gmail & Email Clients -->
        <div style="margin-bottom: 16px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(params.nfcUrl)}" alt="Visit QR Pass" style="width: 150px; height: 150px; border-radius: 10px; border: 2px solid #bfdbfe; padding: 8px; background: #ffffff; display: inline-block;" />
          <p style="font-family: monospace; font-size: 12px; font-weight: 700; color: #1e40af; margin-top: 6px;">${params.nfcId}</p>
        </div>

        <a href="${params.nfcUrl}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
          Open NFC Digital Pass 📲
        </a>
      </div>

      ${
        params.instructions
          ? `<div style="margin-bottom: 20px; padding: 12px 16px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 13px; color: #92400e;">
              <strong>Special Instructions:</strong> ${params.instructions}
             </div>`
          : ''
      }

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
        You can also access this pass anytime directly from your <strong>Parent Dashboard &rarr; Visit Requests &rarr; NFC Pass</strong>. Please bring a government-issued photo ID for security clearance.
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

