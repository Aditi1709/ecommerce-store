"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

export type Role = "null" | "user" | "merchant" | "admin" | "pro_admin" | "owner";

export const ROLE_RANK: Record<Role, number> = {
  null: 0,
  user: 1,
  merchant: 2,
  admin: 3,
  pro_admin: 4,
  owner: 5,
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: User | null;
}

interface AuthContextType extends AuthState {
  saveAuth: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const EMPTY_AUTH = JSON.stringify({ token: null, user: null });

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("auth-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("auth-updated", callback);
  };
}

function getSnapshot() {
  return localStorage.getItem("auth") ?? EMPTY_AUTH;
}

function getServerSnapshot() {
  return EMPTY_AUTH;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { token, user }: AuthState = useMemo(() => JSON.parse(raw), [raw]);

  const saveAuth = (newToken: string, newUser: User) => {
    localStorage.setItem("auth", JSON.stringify({ token: newToken, user: newUser }));
    window.dispatchEvent(new Event("auth-updated"));
  };

  const logout = () => {
    localStorage.removeItem("auth");
    window.dispatchEvent(new Event("auth-updated"));
  };

  return (
    <AuthContext.Provider value={{ token, user, saveAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}