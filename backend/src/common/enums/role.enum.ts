/**
 * User roles for Role-Based Access Control (RBAC).
 * Kept in sync with the Prisma `Role` enum in schema.prisma.
 */
export enum Role {
  ADMIN = 'ADMIN',
  ORPHANAGE = 'ORPHANAGE',
  PARENT = 'PARENT',
  SOCIAL_WORKER = 'SOCIAL_WORKER',
  GUEST = 'GUEST',
  DONOR = 'DONOR',
}

/**
 * OTP purposes — determines delivery template and post-verification action.
 * Kept in sync with Prisma `OtpPurpose` enum.
 */
export enum OtpPurpose {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  TWO_FACTOR_AUTH = 'TWO_FACTOR_AUTH',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SENSITIVE_ACTION = 'SENSITIVE_ACTION',
}

/**
 * Auth provider.
 * Kept in sync with Prisma `AuthProvider` enum.
 */
export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
}
