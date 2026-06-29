import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/Card";
export function StatCard({ title, value, change, icon, className }) {
    return (_jsxs(Card, { className: cn("flex items-start justify-between", className), children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-wealth-muted", children: title }), _jsx("p", { className: "mt-1 text-2xl font-bold text-gray-900", children: value }), change !== undefined && (_jsxs("p", { className: cn("mt-1 text-xs font-medium", change >= 0 ? "text-wealth-success" : "text-wealth-danger"), children: [change >= 0 ? "+" : "", change, "%"] }))] }), icon && _jsx("div", { className: "text-2xl text-primary-500", children: icon })] }));
}
