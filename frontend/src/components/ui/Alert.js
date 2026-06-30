import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cn } from "@/utils/cn";
// ---------------------------------------------------------------------------
// Variant style map
// ---------------------------------------------------------------------------
const variantStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-red-50 border-red-200 text-red-800",
};
// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------
export const Alert = forwardRef(({ children, variant = "info", title, onClose, className, ...props }, ref) => (_jsx("div", { ref: ref, role: "alert", className: cn("rounded-lg border p-4", variantStyles[variant], className), ...props, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [title && _jsx("p", { className: "mb-1 font-medium", children: title }), _jsx("div", { className: "text-sm", children: children })] }), onClose && (_jsx("button", { type: "button", onClick: onClose, className: "ml-4 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current", "aria-label": "Dismiss alert", children: "\u2715" }))] }) })));
Alert.displayName = "Alert";
