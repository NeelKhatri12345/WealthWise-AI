import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "./routes";
import { UserRole } from "@/constants/roles";
export function AdminRoute() {
    const { isAuthenticated, user, isLoading } = useAuth();
    if (isLoading) {
        return null;
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: ROUTES.LOGIN, replace: true });
    }
    if (user?.role !== UserRole.ADMIN) {
        return _jsx(Navigate, { to: ROUTES.UNAUTHORIZED, replace: true });
    }
    return _jsx(Outlet, {});
}
