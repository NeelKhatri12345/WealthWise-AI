import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const SystemMonitor = ({ metrics }) => {
    const barColor = (status) => {
        switch (status) {
            case 'normal': return 'bg-green-500';
            case 'warning': return 'bg-yellow-500';
            case 'critical': return 'bg-red-500';
        }
    };
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: "System Resources" }), _jsx("div", { className: "space-y-4", children: metrics.map((metric) => {
                    const pct = (metric.value / metric.maxValue) * 100;
                    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: metric.label }), _jsxs("span", { className: "text-sm text-gray-500", children: [metric.value, metric.unit, " / ", metric.maxValue, metric.unit] })] }), _jsx("div", { className: "h-3 w-full rounded-full bg-gray-200", children: _jsx("div", { className: `h-3 rounded-full ${barColor(metric.status)} transition-all`, style: { width: `${pct}%` } }) })] }, metric.label));
                }) })] }));
};
