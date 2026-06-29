import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
const colorClasses = {
    primary: "bg-primary-500",
    success: "bg-wealth-success",
    warning: "bg-wealth-warning",
    danger: "bg-wealth-danger",
};
const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
};
export function ProgressBar({ value, max = 100, label, showValue, color = "primary", size = "md", className, }) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (_jsxs("div", { className: className, children: [(label || showValue) && (_jsxs("div", { className: "mb-1 flex items-center justify-between text-sm", children: [label && _jsx("span", { className: "text-wealth-muted", children: label }), showValue && _jsxs("span", { className: "font-medium text-gray-900", children: [Math.round(percentage), "%"] })] })), _jsx("div", { className: cn("w-full overflow-hidden rounded-full bg-gray-200", sizeClasses[size]), children: _jsx("div", { className: cn("h-full rounded-full transition-all duration-300", colorClasses[color]), style: { width: `${percentage}%` } }) })] }));
}
