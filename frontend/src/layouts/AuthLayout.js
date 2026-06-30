import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
import { Card } from "@/components/ui/Card";
// ---------------------------------------------------------------------------
// Branding icon (inline SVG — no external asset dependency)
// ---------------------------------------------------------------------------
function BrandIcon({ className }) {
    return (_jsxs("svg", { viewBox: "0 0 40 40", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: className, "aria-hidden": "true", children: [_jsx("rect", { width: "40", height: "40", rx: "10", className: "fill-white/20" }), _jsx("path", { d: "M12 28V18l8-6 8 6v10a2 2 0 01-2 2H14a2 2 0 01-2-2z", className: "stroke-white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M18 30v-8h4v8", className: "stroke-white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })] }));
}
// ---------------------------------------------------------------------------
// Feature highlights shown on the branding panel
// ---------------------------------------------------------------------------
const features = [
    { title: "AI-Powered Insights", description: "Smart analysis of your spending patterns" },
    { title: "Portfolio Tracking", description: "Real-time monitoring of your investments" },
    { title: "Financial Health Score", description: "Understand your financial wellness at a glance" },
];
// ---------------------------------------------------------------------------
// AuthLayout
// ---------------------------------------------------------------------------
export function AuthLayout() {
    return (_jsxs("div", { className: "flex min-h-screen", children: [_jsx("div", { className: "hidden lg:flex lg:w-1/2 xl:w-[55%]", children: _jsxs("div", { className: "relative flex w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-10 xl:p-14", children: [_jsx("div", { className: "pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5", "aria-hidden": "true" }), _jsx("div", { className: "pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5", "aria-hidden": "true" }), _jsx("div", { className: "relative z-10", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(BrandIcon, { className: "h-10 w-10" }), _jsx("span", { className: "text-2xl font-bold tracking-tight text-white", children: "WealthWise AI" })] }) }), _jsxs("div", { className: "relative z-10 space-y-8", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold leading-tight text-white xl:text-4xl", children: ["Your intelligent", _jsx("br", {}), "financial companion"] }), _jsx("p", { className: "mt-3 max-w-md text-base text-primary-200", children: "Take control of your finances with AI-driven insights, smart budgeting, and personalised coaching." })] }), _jsx("div", { className: "space-y-4", children: features.map((f) => (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20", children: _jsx("svg", { className: "h-3 w-3 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, "aria-hidden": "true", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-white", children: f.title }), _jsx("p", { className: "text-sm text-primary-200", children: f.description })] })] }, f.title))) })] }), _jsxs("p", { className: "relative z-10 text-xs text-primary-300", children: ["\u00A9 ", new Date().getFullYear(), " WealthWise AI. All rights reserved."] })] }) }), _jsxs("div", { className: "flex w-full flex-col items-center justify-center bg-wealth-bg px-4 py-10 lg:w-1/2 xl:w-[45%]", children: [_jsxs("div", { className: "mb-8 flex items-center gap-2 lg:hidden", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600", children: _jsx(BrandIcon, { className: "h-6 w-6" }) }), _jsx("span", { className: "text-xl font-bold text-gray-900", children: "WealthWise AI" })] }), _jsx(Card, { padding: "lg", className: "w-full max-w-md", children: _jsx(Outlet, {}) })] })] }));
}
