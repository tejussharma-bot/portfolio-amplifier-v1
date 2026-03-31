"use client";

import {
  createContext,
  useCallback,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  fetchCurrentUser,
  loginUser,
  registerUser,
  type SessionUser
} from "@/lib/api";

const STORAGE_KEY = "portfolio-ai-token";

interface AuthContextValue {
  user: SessionUser | null;
  token: string | null;
  ready: boolean;
  isAuthenticated: boolean;
  register: (payload: {
    email: string;
    password: string;
    full_name?: string;
  }) => Promise<SessionUser>;
  login: (payload: { email: string; password: string }) => Promise<SessionUser>;
  logout: () => void;
  refreshUser: () => Promise<SessionUser | null>;
  setSession: (nextToken: string, nextUser?: SessionUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const url = new URL(window.location.href);
      const tokenFromQuery = url.searchParams.get("token");
      const storedToken = tokenFromQuery || window.localStorage.getItem(STORAGE_KEY);

      if (!storedToken) {
        if (active) {
          setReady(true);
        }
        return;
      }

      try {
        const result = await fetchCurrentUser(storedToken);

        if (!active) {
          return;
        }

        window.localStorage.setItem(STORAGE_KEY, storedToken);
        startTransition(() => {
          setToken(storedToken);
          setUser(result.user);
          setReady(true);
        });

        if (tokenFromQuery) {
          url.searchParams.delete("token");
          window.history.replaceState({}, "", url.toString());
        }
      } catch (error) {
        if (!active) {
          return;
        }

        window.localStorage.removeItem(STORAGE_KEY);
        startTransition(() => {
          setToken(null);
          setUser(null);
          setReady(true);
        });
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const setSession = useCallback((nextToken: string, nextUser?: SessionUser | null) => {
    window.localStorage.setItem(STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser ?? null);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    startTransition(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const result = await fetchCurrentUser(token);
      setUser(result.user);
      return result.user;
    } catch (error) {
      logout();
      return null;
    }
  }, [logout, token]);

  const register = useCallback(async (payload: {
    email: string;
    password: string;
    full_name?: string;
  }) => {
    const result = await registerUser(payload);
    setSession(result.token, result.user);
    return result.user;
  }, [setSession]);

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const result = await loginUser(payload);
    setSession(result.token, result.user);
    return result.user;
  }, [setSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      ready,
      isAuthenticated: Boolean(token && user),
      register,
      login,
      logout,
      refreshUser,
      setSession
    }),
    [login, logout, ready, refreshUser, register, setSession, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
