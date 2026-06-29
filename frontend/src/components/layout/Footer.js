import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
export function Footer({ className }) {
    return (_jsx("footer", { className: cn("border-t border-wealth-border bg-wealth-card px-6 py-4", className), children: _jsxs("div", { className: "flex items-center justify-between text-xs text-wealth-muted", children: [_jsxs("span", { children: ["\u00A9 ", new Date().getFullYear(), " WealthWise AI. All rights reserved."] }), _jsx("span", { children: "v0.1.0" })] }) }));
}
