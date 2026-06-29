import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ReportList = ({ reports, onView, onDownload }) => {
    const statusStyles = {
        ready: 'bg-green-100 text-green-700',
        generating: 'bg-yellow-100 text-yellow-700',
        failed: 'bg-red-100 text-red-700',
    };
    return (_jsxs("div", { className: "rounded-xl bg-white shadow-sm border border-gray-100", children: [_jsx("div", { className: "border-b border-gray-100 px-6 py-4", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Reports" }) }), reports.length === 0 ? (_jsx("p", { className: "p-6 text-center text-sm text-gray-500", children: "No reports generated yet" })) : (_jsx("div", { className: "divide-y divide-gray-100", children: reports.map((report) => (_jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: report.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [report.type, " \u00B7 ", report.dateRange, " \u00B7 ", report.generatedAt] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[report.status]}`, children: report.status.charAt(0).toUpperCase() + report.status.slice(1) }), report.status === 'ready' && (_jsxs("div", { className: "flex gap-2", children: [onView && (_jsx("button", { onClick: () => onView(report.id), className: "text-xs text-indigo-600 hover:text-indigo-500", children: "View" })), onDownload && (_jsx("button", { onClick: () => onDownload(report.id), className: "text-xs text-indigo-600 hover:text-indigo-500", children: "Download" }))] }))] })] }, report.id))) }))] }));
};
