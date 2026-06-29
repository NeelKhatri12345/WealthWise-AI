import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
const variants = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-red-50 border-red-200 text-red-800",
};
export function Alert({ children, variant = "info", title, onClose, className }) {
    return (_jsx("div", { className: cn("rounded-lg border p-4", variants[variant], className), role: "alert", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [title && _jsx("p", { className: "mb-1 font-medium", children: title }), _jsx("div", { className: "text-sm", children: children })] }), onClose && (_jsx("button", { onClick: onClose, className: "ml-4 opacity-70 hover:opacity-100", children: "\u2715" }))] }) }));
}
