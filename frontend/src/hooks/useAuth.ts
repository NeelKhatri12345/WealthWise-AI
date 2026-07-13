import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  logout as logoutThunk,
  type User as ReduxAuthUser,
} from "@/store/slices/authSlice";
import type { AuthContextValue } from "@/context/AuthContext";
import type { User } from "@/types/auth.types";
import type { UserRole } from "@/constants/roles";

function mapReduxUser(user: ReduxAuthUser): User {
  const nameParts = user.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return {
    id: user.id,
    email: user.email,
    firstName,
    lastName,
    role: user.role as UserRole,
    phone: user.phone,
    isVerified: user.isVerified,
    createdAt: "",
    updatedAt: "",
  };
}

export function useAuth(): AuthContextValue {
  const dispatch = useAppDispatch();
  const { user, accessToken, isAuthenticated, isLoading, isHydrated } =
    useAppSelector((state) => state.auth);

  const logout = useCallback(() => {
    void dispatch(logoutThunk());
  }, [dispatch]);

  const login = useCallback(() => {
    // Authentication is handled via Redux auth thunks on auth pages.
  }, []);

  return useMemo(
    () => ({
      user: user ? mapReduxUser(user) : null,
      token: accessToken,
      isAuthenticated,
      isLoading: isLoading || !isHydrated,
      login,
      logout,
    }),
    [user, accessToken, isAuthenticated, isLoading, isHydrated, login, logout],
  );
}
