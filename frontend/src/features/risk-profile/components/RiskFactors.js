import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const RiskFactors = ({ factors }) => {
    const statusStyles = {
        good: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
        warning: { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
        danger: { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
    };
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: "Risk Factors" }), _jsx("div", { className: "space-y-4", children: factors.map((factor) => {
                    const pct = (factor.value / factor.maxValue) * 100;
                    const style = statusStyles[factor.status];
                    return (_jsxs("div", { className: "rounded-lg bg-gray-50 p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-900", children: factor.name }), _jsxs("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`, children: [factor.value, "/", factor.maxValue] })] }), _jsx("div", { className: "h-2 w-full rounded-full bg-gray-200", children: _jsx("div", { className: `h-2 rounded-full ${style.bar} transition-all`, style: { width: `${pct}%` } }) }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: factor.description })] }, factor.name));
                }) })] }));
};
