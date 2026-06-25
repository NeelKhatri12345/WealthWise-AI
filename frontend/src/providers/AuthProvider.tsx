import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { AuthContext } from "@/context/AuthContext";
import { storage } from "@/lib/storage";
import type { User } from "@/types/auth.types";

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = "wealthwise-token";
const USER_KEY = "wealthwise-user";

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => storage.get<User>(USER_KEY));
  const [token, setToken] = useState<string | null>(() => storage.get<string>(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = storage.get<string>(TOKEN_KEY);
    const savedUser = storage.get<User>(USER_KEY);
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    storage.set(TOKEN_KEY, newToken);
    storage.set(USER_KEY, newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    storage.remove(TOKEN_KEY);
    storage.remove(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  const value = useMemo(
    () => ({ user, token, isAuthenticated, isLoading, login, logout }),
    [user, token, isAuthenticated, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
