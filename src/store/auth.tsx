import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SessionUser } from '@/types/navigation';
import { login as loginRequest, logout as logoutRequest } from '@/services/auth';
import { UNAUTHORIZED_EVENT } from '@/services/http';
import { readStorage, readText, removeStorage, STORAGE_KEYS, writeStorage, writeText } from '@/utils/storage';

interface AuthContextValue {
  token: string | null;
  user: SessionUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  login: (userName: string, password: string, remember: boolean) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readText(STORAGE_KEYS.token) ?? null);
  const [user, setUser] = useState<SessionUser | null>(() => readStorage<SessionUser>(STORAGE_KEYS.user) ?? null);

  const clearSession = useCallback(() => {
    removeStorage(STORAGE_KEYS.token);
    removeStorage(STORAGE_KEYS.user);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (userName: string, password: string, remember: boolean) => {
    const result = await loginRequest({ userName, password });
    writeText(STORAGE_KEYS.token, result.token);
    writeStorage(STORAGE_KEYS.user, result.user);
    setToken(result.token);
    setUser(result.user);
    if (remember) {
      writeText(STORAGE_KEYS.loginUserName, result.user.userName);
    } else {
      removeStorage(STORAGE_KEYS.loginUserName);
    }
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      permissions: user?.permissions ?? [],
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return context;
}
