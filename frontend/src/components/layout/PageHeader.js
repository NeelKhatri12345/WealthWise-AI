import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
export function PageHeader({ title, description, actions, className }) {
    return (_jsxs("div", { className: cn("mb-6 flex items-start justify-between", className), children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: title }), description && _jsx("p", { className: "mt-1 text-sm text-wealth-muted", children: description })] }), actions && _jsx("div", { className: "flex items-center gap-2", children: actions })] }));
}
