import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/routes/routes";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";
export function AuthGuard({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    if (isLoading) {
        return _jsx(LoadingScreen, {});
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: ROUTES.LOGIN, state: { from: location }, replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
