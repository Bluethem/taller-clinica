"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface UserSession {
  id: string;
  username: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
  rolDescripcion: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  setUser: (u: UserSession | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        window.sessionStorage.removeItem("sigc_user");
        const response = await fetch(`${API}/auth/me`, {
          credentials: "include",
        });
        const data = response.ok ? await response.json() : null;
        if (active) setUserState(data?.user ?? null);
      } catch {
        if (active) setUserState(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const setUser = (u: UserSession | null) => {
    setUserState(u);
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // La sesión local se limpia incluso si el backend no está disponible.
    } finally {
      setUserState(null);
      router.replace("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

