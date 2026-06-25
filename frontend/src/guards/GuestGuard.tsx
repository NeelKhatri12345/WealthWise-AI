import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/routes/routes";

interface GuestGuardProps {
  children: ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
