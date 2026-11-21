import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface AdminUserProfile {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
  isActive?: boolean;
}

export interface LoginResult {
  ok: boolean;
  error?: string;
}

interface AdminAuthContextValue {
  adminProfile: AdminUserProfile | null;
  loading: boolean;
  authError: string | null;
  signInWithCredentials: (username: string, password: string) => Promise<LoginResult>;
  signOutAdmin: () => Promise<void>;
  getToken: () => Promise<string | null>;
  adminFetch: (path: string, init?: RequestInit) => Promise<Response>;
  clearAuthError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue>({
  adminProfile: null,
  loading: true,
  authError: null,
  signInWithCredentials: async () => ({ ok: false, error: 'Auth provider unavailable' }),
  signOutAdmin: async () => {},
  getToken: async () => null,
  adminFetch: async () => new Response(null, { status: 401 }),
  clearAuthError: () => {},
});

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminProfile, setAdminProfile] = useState<AdminUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const headers = new Headers();
      if (tokenRef.current) {
        headers.set('Authorization', `Bearer ${tokenRef.current}`);
      }
      const res = await fetch('/api/admin/auth/session', {
        credentials: 'same-origin',
        headers,
      });
      if (!res.ok) {
        tokenRef.current = null;
        setAdminProfile(null);
      } else {
        const data = await res.json();
        setAdminProfile(data.user || null);
      }
    } catch {
      tokenRef.current = null;
      setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signInWithCredentials = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      setAuthError(null);
      try {
        const res = await fetch('/api/admin/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = data.error || 'Invalid username or password.';
          setAuthError(message);
          return { ok: false, error: message };
        }

        tokenRef.current = typeof data.token === 'string' ? data.token : null;
        setAdminProfile(data.user as AdminUserProfile);
        setAuthError(null);
        return { ok: true };
      } catch {
        const message = 'Unable to reach the authentication server. Please try again.';
        setAuthError(message);
        return { ok: false, error: message };
      }
    },
    []
  );

  const signOutAdmin = useCallback(async () => {
    try {
      const headers = new Headers();
      if (tokenRef.current) {
        headers.set('Authorization', `Bearer ${tokenRef.current}`);
      }
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers,
      });
    } catch {
      // Clear local session regardless of network errors
    } finally {
      tokenRef.current = null;
      setAdminProfile(null);
      setAuthError(null);
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    return tokenRef.current;
  }, []);

  const adminFetch = useCallback(async (path: string, init: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (tokenRef.current) {
      headers.set('Authorization', `Bearer ${tokenRef.current}`);
    }
    if (!(init.body instanceof FormData) && init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers,
    });

    if (res.status === 401) {
      tokenRef.current = null;
      setAdminProfile(null);
    }

    return res;
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AdminAuthContext.Provider
      value={{
        adminProfile,
        loading,
        authError,
        signInWithCredentials,
        signOutAdmin,
        getToken,
        adminFetch,
        clearAuthError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
