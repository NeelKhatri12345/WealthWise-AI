import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "./routes";
export function PrivateRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    if (isLoading) {
        return null;
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: ROUTES.LOGIN, state: { from: location }, replace: true });
    }
    return _jsx(Outlet, {});
}
