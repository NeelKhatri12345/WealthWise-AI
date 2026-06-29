import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const OcrMonitor = ({ stats }) => {
    const statusStyles = {
        running: 'bg-green-100 text-green-700',
        idle: 'bg-gray-100 text-gray-700',
        error: 'bg-red-100 text-red-700',
    };
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "OCR Pipeline" }), _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[stats.status]}`, children: stats.status })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "rounded-lg bg-gray-50 p-3", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Total Processed" }), _jsx("p", { className: "text-lg font-bold text-gray-900", children: stats.totalProcessed.toLocaleString() })] }), _jsxs("div", { className: "rounded-lg bg-gray-50 p-3", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Success Rate" }), _jsxs("p", { className: "text-lg font-bold text-gray-900", children: [stats.successRate, "%"] })] }), _jsxs("div", { className: "rounded-lg bg-gray-50 p-3", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Avg Processing Time" }), _jsxs("p", { className: "text-lg font-bold text-gray-900", children: [stats.avgProcessingTime, "s"] })] }), _jsxs("div", { className: "rounded-lg bg-gray-50 p-3", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Queue Size" }), _jsx("p", { className: "text-lg font-bold text-gray-900", children: stats.queueSize })] })] })] }));
};
