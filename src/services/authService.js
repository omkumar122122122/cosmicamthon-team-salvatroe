/**
 * authService.js — Real backend authentication
 * Connects to NestJS Auth module at /api/v1/auth/*
 */

import { apiClient } from './apiClient';

function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return response.data;
  }
  return response;
}

/**
 * Normalize backend user to frontend shape.
 * Backend returns: { id, email, firstName, lastName, role, isEmailVerified, ... }
 * Frontend expects: { id, name, email, role (lowercase), avatar, department, firstName, lastName }
 */
function normalizeUser(user) {
  if (!user) return null;
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const name = user.name || `${firstName} ${lastName}`.trim() || user.email;
  const role = (user.role || 'guest').toString().toLowerCase();
  const avatar =
    user.avatar ||
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    (user.email || '?').charAt(0).toUpperCase();

  return {
    ...user,
    id: user.id,
    orphanageId: user.orphanageId || user.orphanage?.id || null,
    name,
    firstName,
    lastName,
    email: user.email,
    role,
    avatar,
    department: user.department || roleLabel(role),
    isEmailVerified: user.isEmailVerified,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
  };
}

function roleLabel(role) {
  const map = {
    admin: 'Child Welfare Directorate',
    parent: 'Registered Guardian',
    orphanage: 'Care Home Operations',
    social_worker: 'Social Worker',
    guest: 'Guest',
  };
  return map[role] || role;
}

/**
 * Login with email + password
 * @returns {Promise<{ user: object, tokens: { accessToken, refreshToken } }>}
 */
export async function login({ email, password, role }) {
  const payload = { email, password };
  // Backend stores roles in UPPERCASE (ADMIN, ORPHANAGE, PARENT).
  if (role) payload.role = role.toUpperCase();
  const response = await apiClient.post('/auth/login', payload);
  const data = unwrap(response);

  return {
    user: normalizeUser(data.user),
    tokens: {
      accessToken: data.tokens?.accessToken || data.accessToken,
      refreshToken: data.tokens?.refreshToken || data.refreshToken,
      accessTokenExpiresAt: data.tokens?.accessTokenExpiresAt,
      refreshTokenExpiresAt: data.tokens?.refreshTokenExpiresAt,
    },
    message: data.message,
  };
}

/**
 * Register a new user
 */
export async function register(payload) {
  const response = await apiClient.post('/auth/register', payload);
  return unwrap(response);
}

/**
 * Logout — revokes current session
 */
export async function logout(refreshToken) {
  try {
    const body = refreshToken ? { refreshToken } : {};
    const response = await apiClient.post('/auth/logout', body);
    return unwrap(response) || { success: true };
  } catch {
    // Always succeed locally even if backend call fails
    return { success: true };
  }
}

/**
 * Refresh access + refresh token pair
 */
export async function refreshTokens(refreshToken) {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  const data = unwrap(response);

  return {
    accessToken: data.accessToken || data.tokens?.accessToken,
    refreshToken: data.refreshToken || data.tokens?.refreshToken,
    accessTokenExpiresAt: data.accessTokenExpiresAt || data.tokens?.accessTokenExpiresAt,
    refreshTokenExpiresAt: data.refreshTokenExpiresAt || data.tokens?.refreshTokenExpiresAt,
  };
}

/**
 * Get current authenticated user profile
 */
export async function getMe() {
  const response = await apiClient.get('/auth/me');
  return normalizeUser(unwrap(response));
}

/**
 * Request password reset email
 */
export async function forgotPassword(email) {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return unwrap(response);
}

/**
 * Reset password with token
 */
export async function resetPassword({ token, password, confirmPassword }) {
  const response = await apiClient.post('/auth/reset-password', {
    token,
    password,
    confirmPassword,
  });
  return unwrap(response);
}

/**
 * Change password (authenticated)
 */
export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  const response = await apiClient.patch('/auth/change-password', {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return unwrap(response);
}

/**
 * Update current user profile
 */
export async function updateMe(data) {
  const response = await apiClient.patch('/auth/me', data);
  return normalizeUser(unwrap(response));
}

/**
 * Verify email with token
 */
export async function verifyEmail(token) {
  const response = await apiClient.post('/auth/verify-email', { token });
  return unwrap(response);
}

/**
 * Send OTP
 */
export async function sendOtp(purpose) {
  const response = await apiClient.post('/auth/otp/send', { purpose });
  return unwrap(response);
}

/**
 * Verify OTP
 */
export async function verifyOtp({ code, purpose }) {
  const response = await apiClient.post('/auth/otp/verify', { code, purpose });
  return unwrap(response);
}
