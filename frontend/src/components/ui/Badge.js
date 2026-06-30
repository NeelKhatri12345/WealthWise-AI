import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cn } from "@/utils/cn";
// ---------------------------------------------------------------------------
// Variant & size style maps
// ---------------------------------------------------------------------------
const variantStyles = {
    default: "bg-gray-100 text-gray-700",
    primary: "bg-primary-100 text-primary-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    neutral: "bg-gray-50 text-gray-500",
};
const sizeStyles = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-0.5 text-xs gap-1.5",
};
// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
export const Badge = forwardRef(({ className, variant = "default", size = "md", leftIcon, rightIcon, children, ...props }, ref) => (_jsxs("span", { ref: ref, className: cn("inline-flex items-center rounded-full font-medium", variantStyles[variant], sizeStyles[size], className), ...props, children: [leftIcon && (_jsx("span", { className: "inline-flex shrink-0", "aria-hidden": "true", children: leftIcon })), children, rightIcon && (_jsx("span", { className: "inline-flex shrink-0", "aria-hidden": "true", children: rightIcon }))] })));
Badge.displayName = "Badge";
