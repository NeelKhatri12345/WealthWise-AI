import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
export function NavGroup({ label, children, className }) {
    return (_jsxs("div", { className: cn("mb-4", className), children: [_jsx("p", { className: "mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-wealth-muted", children: label }), _jsx("div", { className: "space-y-1", children: children })] }));
}
