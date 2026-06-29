import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/routes/routes";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";
export function RoleGuard({ children, allowedRoles }) {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return _jsx(LoadingScreen, {});
    }
    if (!user || !allowedRoles.includes(user.role)) {
        return _jsx(Navigate, { to: ROUTES.UNAUTHORIZED, replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
