import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
export function EmptyState({ title, description, icon, action, className }) {
    return (_jsxs("div", { className: cn("flex flex-col items-center justify-center py-12 text-center", className), children: [icon && _jsx("div", { className: "mb-4 text-4xl text-wealth-muted", children: icon }), _jsx("h3", { className: "mb-1 text-lg font-medium text-gray-900", children: title }), description && _jsx("p", { className: "mb-4 max-w-sm text-sm text-wealth-muted", children: description }), action] }));
}
