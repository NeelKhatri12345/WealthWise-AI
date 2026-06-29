import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/Card";
export function InfoCard({ title, children, footer, className }) {
    return (_jsxs(Card, { padding: "none", className: cn("overflow-hidden", className), children: [_jsx("div", { className: "border-b border-wealth-border px-6 py-4", children: _jsx("h3", { className: "font-semibold text-gray-900", children: title }) }), _jsx("div", { className: "p-6", children: children }), footer && (_jsx("div", { className: "border-t border-wealth-border bg-gray-50 px-6 py-3", children: footer }))] }));
}
