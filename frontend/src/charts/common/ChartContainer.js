import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const defaultTimeRanges = ['7d', '30d', '90d', '6m', '1y'];
const timeRangeLabels = {
    '7d': '7D',
    '30d': '30D',
    '90d': '90D',
    '6m': '6M',
    '1y': '1Y',
    all: 'All',
};
const ChartContainer = ({ title, subtitle, children, showTimeRange = false, timeRanges = defaultTimeRanges, defaultRange = '30d', onTimeRangeChange, actions, className = '', }) => {
    const [activeRange, setActiveRange] = useState(defaultRange);
    const handleRangeChange = (range) => {
        setActiveRange(range);
        onTimeRangeChange?.(range);
    };
    return (_jsxs("div", { className: `bg-white rounded-xl border border-slate-200 shadow-sm ${className}`, children: [_jsxs("div", { className: "flex items-start justify-between px-5 pt-5 pb-2", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-base font-semibold text-slate-800", children: title }), subtitle && (_jsx("p", { className: "text-sm text-slate-500 mt-0.5", children: subtitle }))] }), _jsxs("div", { className: "flex items-center gap-3", children: [showTimeRange && (_jsx("div", { className: "flex items-center bg-slate-100 rounded-lg p-0.5", children: timeRanges.map((range) => (_jsx("button", { onClick: () => handleRangeChange(range), className: `px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${activeRange === range
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'}`, children: timeRangeLabels[range] }, range))) })), actions] })] }), _jsx("div", { className: "px-2 pb-3", children: children })] }));
};
export default ChartContainer;
