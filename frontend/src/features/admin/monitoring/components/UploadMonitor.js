import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const UploadMonitor = ({ stats }) => {
    const statusStyles = {
        normal: 'bg-green-100 text-green-700',
        busy: 'bg-yellow-100 text-yellow-700',
        overloaded: 'bg-red-100 text-red-700',
    };
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Upload Queue" }), _jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[stats.status]}`, children: stats.status })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "rounded-lg bg-gray-50 p-3", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Total Uploads" }), _jsx("p", { className: "text-lg font-bold text-gray-900", children: stats.totalUploads.toLocaleString() })] }), _jsxs("div", { className: "rounded-lg bg-gray-50 p-3", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Processing" }), _jsx("p", { className: "text-lg font-bold text-yellow-600", children: stats.processingCount })] }), _jsxs("div", { className: "rounded-lg bg-gray-50 p-3", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Failed" }), _jsx("p", { className: "text-lg font-bold text-red-600", children: stats.failedCount })] }), _jsxs("div", { className: "rounded-lg bg-gray-50 p-3", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Avg Size" }), _jsx("p", { className: "text-lg font-bold text-gray-900", children: stats.avgUploadSize })] })] })] }));
};
