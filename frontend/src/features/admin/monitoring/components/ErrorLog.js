import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const severityStyles = {
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    critical: 'bg-red-200 text-red-800',
};
export const ErrorLog = ({ errors, onViewDetail }) => {
    return (_jsxs("div", { className: "rounded-xl bg-white shadow-sm border border-gray-100", children: [_jsx("div", { className: "border-b border-gray-100 px-6 py-4", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Recent Errors" }) }), errors.length === 0 ? (_jsx("div", { className: "p-6 text-center", children: _jsx("p", { className: "text-sm text-green-600 font-medium", children: "No recent errors" }) })) : (_jsx("div", { className: "divide-y divide-gray-100", children: errors.map((err) => (_jsxs("div", { onClick: () => onViewDetail?.(err.id), className: "flex items-start gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors", children: [_jsx("span", { className: `mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${severityStyles[err.severity]}`, children: err.severity }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: err.message }), _jsxs("p", { className: "text-xs text-gray-500", children: [err.source, " \u00B7 ", err.timestamp, err.count > 1 && _jsxs(_Fragment, { children: [" \u00B7 ", err.count, " occurrences"] })] })] })] }, err.id))) }))] }));
};
