import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cn } from "@/utils/cn";
export const Input = forwardRef(({ className, label, error, helperText, id, ...props }, ref) => (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: id, className: "mb-1 block text-sm font-medium text-gray-700", children: label })), _jsx("input", { ref: ref, id: id, className: cn("w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2", error
                ? "border-wealth-danger focus:ring-red-300"
                : "border-wealth-border focus:border-primary-500 focus:ring-primary-300", className), ...props }), error && _jsx("p", { className: "mt-1 text-xs text-wealth-danger", children: error }), helperText && !error && _jsx("p", { className: "mt-1 text-xs text-wealth-muted", children: helperText })] })));
Input.displayName = "Input";
