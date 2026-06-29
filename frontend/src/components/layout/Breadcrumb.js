import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";
export function Breadcrumb({ items, className }) {
    return (_jsx("nav", { className: cn("flex items-center text-sm text-wealth-muted", className), "aria-label": "Breadcrumb", children: items.map((item, index) => (_jsxs("span", { className: "flex items-center", children: [index > 0 && _jsx("span", { className: "mx-2", children: "/" }), item.href ? (_jsx(Link, { to: item.href, className: "hover:text-primary-600", children: item.label })) : (_jsx("span", { className: "text-gray-900", children: item.label }))] }, item.label))) }));
}
