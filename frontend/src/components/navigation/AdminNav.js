import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/routes/routes";
const adminNavItems = [
    { label: "Dashboard", path: ROUTES.ADMIN_DASHBOARD },
    { label: "Users", path: ROUTES.ADMIN_USERS },
];
export function AdminNav() {
    return (_jsxs("aside", { className: "flex w-64 flex-col border-r border-wealth-border bg-gray-900 text-white", children: [_jsx("div", { className: "flex h-16 items-center px-6", children: _jsx("span", { className: "text-xl font-bold text-white", children: "Admin Panel" }) }), _jsx("nav", { className: "flex-1 space-y-1 px-3 py-4", children: adminNavItems.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => cn("block rounded-lg px-3 py-2 text-sm font-medium transition-colors", isActive
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"), children: item.label }, item.path))) })] }));
}
