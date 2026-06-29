import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/routes/routes";
export function GuestGuard({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return null;
    }
    if (isAuthenticated) {
        return _jsx(Navigate, { to: ROUTES.DASHBOARD, replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
