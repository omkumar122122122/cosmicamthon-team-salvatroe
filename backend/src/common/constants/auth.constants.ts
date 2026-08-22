// ─────────────────────────────────────────────
// Decorator metadata keys
// ─────────────────────────────────────────────
export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';
export const SKIP_THROTTLE_KEY = 'skipThrottle';

// ─────────────────────────────────────────────
// Passport strategy names
// ─────────────────────────────────────────────
export const JWT_ACCESS_STRATEGY = 'jwt-access';
export const JWT_REFRESH_STRATEGY = 'jwt-refresh';
export const LOCAL_STRATEGY = 'local';

// ─────────────────────────────────────────────
// Header / cookie names
// ─────────────────────────────────────────────
export const REFRESH_TOKEN_HEADER = 'x-refresh-token';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';
export const ACCESS_TOKEN_HEADER = 'authorization';

// ─────────────────────────────────────────────
// JWT payload type discriminators
// ─────────────────────────────────────────────
export const TOKEN_TYPE_ACCESS = 'access';
export const TOKEN_TYPE_REFRESH = 'refresh';

// ─────────────────────────────────────────────
// Refresh token revocation reasons
// ─────────────────────────────────────────────
export const REVOKE_REASON_LOGOUT = 'LOGOUT';
export const REVOKE_REASON_ROTATION = 'ROTATION';
export const REVOKE_REASON_SECURITY = 'SECURITY';
export const REVOKE_REASON_EXPIRED = 'EXPIRED';

// ─────────────────────────────────────────────
// Audit log action constants
// ─────────────────────────────────────────────
export const AUDIT_ACTIONS = {
  REGISTER: 'REGISTER',
  LOGIN: 'LOGIN',
  LOGIN_2FA_PENDING: 'LOGIN_2FA_PENDING',
  LOGOUT: 'LOGOUT',
  LOGOUT_ALL: 'LOGOUT_ALL',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  RESET_PASSWORD: 'RESET_PASSWORD',
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  RESEND_VERIFICATION: 'RESEND_VERIFICATION',
  VERIFY_OTP: 'VERIFY_OTP',
  SEND_OTP: 'SEND_OTP',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  SESSION_REVOKED: 'SESSION_REVOKED',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
