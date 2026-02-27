"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { api } from "@/lib/api/client";
import type { Profile } from "@/lib/types/database";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  isSigningOut: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isSigningOut: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const signingOutRef = useRef(false);

  const fetchMe = useCallback(async () => {
    try {
      const data = await api.get<{ user: AuthUser; profile: Profile | null }>(
        "/api/auth/me"
      );
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      setUser(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let stale = false;

    const init = async () => {
      try {
        const data = await api.get<{ user: AuthUser; profile: Profile | null }>(
          "/api/auth/me"
        );
        if (stale) return;
        setUser(data.user);
        setProfile(data.profile);
      } catch {
        if (stale) return;
        setUser(null);
        setProfile(null);
      } finally {
        if (!stale) setLoading(false);
      }
    };

    init();

    return () => {
      stale = true;
    };
  }, []);

  const signOut = async () => {
    signingOutRef.current = true;
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Ignore logout errors
    }
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchMe();
    }
  }, [user, fetchMe]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isSigningOut: signingOutRef.current, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
