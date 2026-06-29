import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
export function NavLink({ to, icon, children, className }) {
    return (_jsxs(RouterNavLink, { to: to, className: ({ isActive }) => cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", isActive
            ? "bg-primary-50 text-primary-700"
            : "text-wealth-muted hover:bg-gray-50 hover:text-gray-900", className), children: [icon && _jsx("span", { className: "text-lg", children: icon }), children] }));
}
