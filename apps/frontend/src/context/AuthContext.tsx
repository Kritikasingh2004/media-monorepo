"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  me,
  logout as apiLogout,
  loadStoredToken,
  setAuthToken,
} from "../lib/api";
import { toast } from "sonner";

interface AuthState {
  user: { id: string; email: string } | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = loadStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    me()
      .then((u) => {
        setUser({ id: u.id, email: u.email });
      })
      .catch(() => {
        setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    setError(null);
    try {
      await apiLogin(email, password);
      const u = await me();
      setUser({ id: u.id, email: u.email });
    } catch (e: unknown) {
      setAuthToken(null);
      const msg = e instanceof Error ? e.message : "Login failed";
      setError(msg);
      throw e;
    }
  }

  async function register(email: string, password: string) {
    setError(null);
    try {
      await apiRegister(email, password);
      const u = await me();
      setUser({ id: u.id, email: u.email });
    } catch (e: unknown) {
      setAuthToken(null);
      const msg = e instanceof Error ? e.message : "Registration failed";
      setError(msg);
      throw e;
    }
  }

  function logout() {
    apiLogout();
    const email = user?.email;
    setUser(null);
    toast.success("Logged out", { description: email });
  }

  const value: AuthState = { user, loading, error, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
