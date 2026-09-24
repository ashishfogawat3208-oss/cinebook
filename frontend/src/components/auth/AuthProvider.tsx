"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import api from "@/lib/api";

import {
  getAccessToken,
  logout as clearAuth,
  saveTokens,
  type AuthTokens,
} from "@/lib/auth";

import type { UserProfile } from "@/lib/types";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (
    username: string,
    password: string
  ) => Promise<void>;

  register: (
    username: string,
    email: string,
    password: string,
    passwordConfirm: string
  ) => Promise<void>;

  logout: () => void;

  refreshUser: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const refreshUser = useCallback(
    async () => {
      const token = getAccessToken();

      if (!token) {
        setUser(null);
        return;
      }

      try {
        const response =
          await api.get<UserProfile>(
            "/auth/profile/"
          );

        setUser(response.data);
      } catch (error) {
        console.error(
          "Failed to refresh authenticated user:",
          error
        );

        setUser(null);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        await refreshUser();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      active = false;
    };
  }, [refreshUser]);

  const login = async (
    username: string,
    password: string
  ) => {
    const response =
      await api.post<AuthTokens>(
        "/auth/login/",
        {
          username,
          password,
        }
      );

    saveTokens(response.data);

    await refreshUser();
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    passwordConfirm: string
  ) => {
    await api.post(
      "/auth/register/",
      {
        username,
        email,
        password,
        password_confirm:
          passwordConfirm,
      }
    );

    await login(
      username,
      password
    );
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated:
          Boolean(user),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}