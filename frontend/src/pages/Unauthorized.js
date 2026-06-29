import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/routes/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function Unauthorized() {
    useDocumentTitle("Unauthorized");
    return (_jsxs("div", { className: "flex min-h-screen flex-col items-center justify-center bg-wealth-bg p-4 text-center", children: [_jsx("h1", { className: "text-8xl font-bold text-wealth-warning", children: "403" }), _jsx("h2", { className: "mt-4 text-2xl font-semibold text-gray-900", children: "Access Denied" }), _jsx("p", { className: "mt-2 max-w-md text-wealth-muted", children: "You do not have permission to access this page. Contact your administrator if you believe this is an error." }), _jsx(Link, { to: ROUTES.DASHBOARD, className: "mt-6", children: _jsx(Button, { children: "Back to Dashboard" }) })] }));
}
