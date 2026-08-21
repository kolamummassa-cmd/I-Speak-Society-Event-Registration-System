"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@isociety/shared";
import { apiClient, setAccessToken, setSessionExpiredHandler } from "@/lib/api-client";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load there's no access token in memory yet, but there may be a
  // valid httpOnly refresh cookie from a previous visit - /me will trigger
  // the apiClient's silent-refresh path automatically via the 401 handler.
  useEffect(() => {
    apiClient
      .get<{ data: { user: AuthUser } }>("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  // Fires whenever a mid-session request's silent refresh fails - the
  // session is actually gone (not just the short-lived access token), so
  // clear local state and send them to login with a message explaining why,
  // instead of letting the raw backend error surface wherever it happened.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      setUser(null);
      router.replace("/login?expired=1");
    });
    return () => setSessionExpiredHandler(null);
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<{ data: { accessToken: string; user: AuthUser } }>(
      "/auth/login",
      { email, password }
    );
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    await apiClient.post("/auth/logout").catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
