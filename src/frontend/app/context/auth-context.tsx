"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  setUser: (u: UserSession | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserSession | null>(null);

  // Persiste en sessionStorage para sobrevivir navegación cliente
  useEffect(() => {
    const stored = sessionStorage.getItem("sigc_user");
    if (stored) {
      try { setUserState(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const setUser = (u: UserSession | null) => {
    setUserState(u);
    if (u) sessionStorage.setItem("sigc_user", JSON.stringify(u));
    else sessionStorage.removeItem("sigc_user");
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

