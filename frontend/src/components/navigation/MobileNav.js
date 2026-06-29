import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { Sidebar } from "@/components/layout/Sidebar";
export function MobileNav({ className }) {
    const [isOpen, setIsOpen] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setIsOpen(true), className: cn("rounded-lg p-2 text-wealth-muted hover:bg-gray-100 lg:hidden", className), "aria-label": "Open menu", children: _jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) }), isOpen && (_jsxs("div", { className: "fixed inset-0 z-50 lg:hidden", children: [_jsx("div", { className: "fixed inset-0 bg-black/50", onClick: () => setIsOpen(false) }), _jsx("div", { className: "relative z-10 h-full w-64", children: _jsx(Sidebar, {}) })] }))] }));
}
