import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const MetricCard = ({ label, value, subtitle, trend, icon }) => {
    const trendColor = trend?.direction === 'up'
        ? 'text-green-600'
        : trend?.direction === 'down'
            ? 'text-red-600'
            : 'text-gray-500';
    const trendArrow = trend?.direction === 'up' ? '\u2191' : trend?.direction === 'down' ? '\u2193' : '\u2192';
    return (_jsxs("div", { className: "rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: label }), _jsx("p", { className: "mt-1 text-2xl font-bold text-gray-900", children: value }), subtitle && _jsx("p", { className: "mt-0.5 text-xs text-gray-400", children: subtitle })] }), icon && (_jsx("div", { className: "rounded-lg bg-indigo-50 p-2 text-indigo-600", children: icon }))] }), trend && (_jsxs("div", { className: `mt-3 flex items-center gap-1 text-sm ${trendColor}`, children: [_jsx("span", { children: trendArrow }), _jsx("span", { children: trend.value })] }))] }));
};
