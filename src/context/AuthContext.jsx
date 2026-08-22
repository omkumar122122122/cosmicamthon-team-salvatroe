import { createContext, useContext, useMemo, useState, useEffect } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);
const USER_STORAGE_KEY = "child_safety_user";
const TOKEN_STORAGE_KEY = "child_safety_token";
const REFRESH_TOKEN_KEY = "child_safety_refresh_token";

function readStoredAuth() {
  const storages = [localStorage, sessionStorage];

  for (const storage of storages) {
    try {
      const savedUser = storage.getItem(USER_STORAGE_KEY);
      const savedToken = storage.getItem(TOKEN_STORAGE_KEY);
      const savedRefreshToken = storage.getItem(REFRESH_TOKEN_KEY);

      if (savedUser && savedToken) {
        return {
          user: JSON.parse(savedUser),
          token: savedToken,
          refreshToken: savedRefreshToken
        };
      }
    } catch {
      storage.removeItem(USER_STORAGE_KEY);
      storage.removeItem(TOKEN_STORAGE_KEY);
      storage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  return { user: null, token: null, refreshToken: null };
}

function persistAuth(user, accessToken, refreshToken) {
  const serializedUser = JSON.stringify(user);

  localStorage.setItem(USER_STORAGE_KEY, serializedUser);
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  sessionStorage.setItem(USER_STORAGE_KEY, serializedUser);
  sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearStoredAuth() {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(USER_STORAGE_KEY);
    storage.removeItem(TOKEN_STORAGE_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
  });
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => readStoredAuth());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setAuthState({ user: null, token: null, refreshToken: null });
      clearStoredAuth();
    };

    const handleTokenRefreshed = (e) => {
      const { token, refreshToken } = e.detail || {};
      setAuthState((prev) => {
        const nextToken = token || prev.token;
        const nextRefreshToken = refreshToken || prev.refreshToken;
        if (prev.user) {
          persistAuth(prev.user, nextToken, nextRefreshToken);
        }
        return {
          ...prev,
          token: nextToken,
          refreshToken: nextRefreshToken,
        };
      });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:token-refreshed', handleTokenRefreshed);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
    };
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      // Backend returns: { user, tokens: { accessToken, refreshToken }, message }
      const response = await authService.login(credentials);
      const { user, tokens } = response;

      setAuthState({
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });

      persistAuth(user, tokens.accessToken, tokens.refreshToken);
      return user;
    } catch (error) {
      // Extract error message from backend response
      const message = error.data?.message || error.message || 'Login failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({ user: null, token: null, refreshToken: null });
      clearStoredAuth();
    }
  };

  const refreshAccessToken = async () => {
    try {
      if (!authState.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshTokens(authState.refreshToken);
      const { accessToken, refreshToken } = response;

      setAuthState(prev => ({
        ...prev,
        token: accessToken,
        refreshToken: refreshToken
      }));

      if (authState.user) {
        persistAuth(authState.user, accessToken, refreshToken);
      }

      return accessToken;
    } catch (error) {
      // If refresh fails, logout user
      setAuthState({ user: null, token: null, refreshToken: null });
      clearStoredAuth();
      throw error;
    }
  };

  const updateUser = async (data) => {
    try {
      const updatedUser = await authService.updateMe(data);
      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));
      persistAuth(updatedUser, prev.token, prev.refreshToken);
      return updatedUser;
    } catch (error) {
      const message = error.data?.message || error.message || 'Failed to update profile';
      throw new Error(message);
    }
  };

  const value = useMemo(() => ({
    user: authState.user,
    token: authState.token,
    refreshToken: authState.refreshToken,
    loading,
    login,
    logout,
    refreshAccessToken,
    updateUser,
    isAuthenticated: Boolean(authState.user && authState.token)
  }), [authState.user, authState.token, authState.refreshToken, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
