import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/routes/routes";
const navItems = [
    { label: "Dashboard", path: ROUTES.DASHBOARD },
    { label: "Upload", path: ROUTES.UPLOAD },
    { label: "Transactions", path: ROUTES.TRANSACTIONS },
    { label: "Health Score", path: ROUTES.HEALTH_SCORE },
    { label: "Risk Profile", path: ROUTES.RISK_PROFILE },
    { label: "Portfolio", path: ROUTES.PORTFOLIO },
    { label: "AI Coach", path: ROUTES.AI_COACH },
    { label: "Reports", path: ROUTES.REPORTS },
    { label: "Notifications", path: ROUTES.NOTIFICATIONS },
];
export function Sidebar() {
    return (_jsxs("aside", { className: "flex w-64 flex-col border-r border-wealth-border bg-wealth-card", children: [_jsx("div", { className: "flex h-16 items-center px-6", children: _jsx("span", { className: "text-xl font-bold text-primary-600", children: "WealthWise" }) }), _jsx("nav", { className: "flex-1 space-y-1 px-3 py-4", children: navItems.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => cn("block rounded-lg px-3 py-2 text-sm font-medium transition-colors", isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-wealth-muted hover:bg-gray-50 hover:text-gray-900"), children: item.label }, item.path))) })] }));
}
