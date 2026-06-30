import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cn } from "@/utils/cn";
// ---------------------------------------------------------------------------
// Size style map
// ---------------------------------------------------------------------------
const sizeStyles = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
};
// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
export const Spinner = forwardRef(({ size = "md", label = "Loading\u2026", className, ...props }, ref) => (_jsxs("div", { ref: ref, role: "status", ...props, children: [_jsxs("svg", { className: cn("animate-spin text-primary-500", sizeStyles[size], className), xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }), _jsx("span", { className: "sr-only", children: label })] })));
Spinner.displayName = "Spinner";
