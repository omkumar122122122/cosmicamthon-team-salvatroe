import { Role } from '../../common/enums/role.enum';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  avatar?: string | null;
  orphanageId?: string | null;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: TokenPair;
  message: string;
}
