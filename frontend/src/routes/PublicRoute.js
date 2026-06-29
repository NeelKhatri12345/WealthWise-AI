import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "./routes";
export function PublicRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return null;
    }
    if (isAuthenticated) {
        return _jsx(Navigate, { to: ROUTES.DASHBOARD, replace: true });
    }
    return _jsx(Outlet, {});
}
