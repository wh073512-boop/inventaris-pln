import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'SUPER_ADMIN' | 'IT_SUPPORT' | 'VIEWER';

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  csrfToken: string;
  isLoading: boolean;
  setupRequired: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  setupAdmin: (username: string, displayName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getApiBase = () => {
  const path = window.location.pathname;
  const appPath = path.endsWith('/') ? path : path.slice(0, path.lastIndexOf('/') + 1);
  return `${appPath}api/`;
};

export const apiBase = getApiBase();

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Permintaan gagal (${response.status}).`);
  }
  return result as T;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}auth.php?action=status`, { credentials: 'same-origin' });
      const status = await readResponse<{
        setupRequired: boolean;
        user: AuthUser | null;
        csrfToken: string;
      }>(response);
      setUser(status.user);
      setSetupRequired(status.setupRequired);
      setCsrfToken(status.csrfToken);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tidak dapat menghubungi server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  const request = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) headers.set('Content-Type', 'application/json');
    if (init.method && !['GET', 'HEAD', 'OPTIONS'].includes(init.method.toUpperCase())) {
      headers.set('X-CSRF-Token', csrfToken);
    }
    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers,
      credentials: 'same-origin',
    });
    return readResponse<T>(response);
  };

  const login = async (username: string, password: string) => {
    setError(null);
    const result = await request<{ user: AuthUser; csrfToken: string }>('auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setUser(result.user);
    setCsrfToken(result.csrfToken);
    setSetupRequired(false);
  };

  const setupAdmin = async (username: string, displayName: string, password: string) => {
    setError(null);
    const result = await request<{ user: AuthUser; csrfToken: string }>('auth.php?action=setup', {
      method: 'POST',
      body: JSON.stringify({ username, displayName, password }),
    });
    setUser(result.user);
    setCsrfToken(result.csrfToken);
    setSetupRequired(false);
  };

  const logout = async () => {
    await request<{ csrfToken: string }>('auth.php?action=logout', {
      method: 'POST',
      body: JSON.stringify({}),
    }).then(result => setCsrfToken(result.csrfToken));
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    csrfToken,
    isLoading,
    setupRequired,
    error,
    refreshStatus,
    login,
    setupAdmin,
    logout,
    request,
  }), [user, csrfToken, isLoading, setupRequired, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  }
  return context;
};
