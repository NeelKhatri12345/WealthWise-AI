import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";
import { ROUTES } from "./routes";
import { UserRole } from "@/constants/roles";

export function AdminRoute() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (user?.role !== UserRole.ADMIN) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
}
