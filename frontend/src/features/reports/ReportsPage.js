import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ReportGenerator, ReportList, ReportFilters, DownloadButton } from './components';
import { useReports } from './hooks';
export const ReportsPage = () => {
    const { reports, isLoading, generateReport, downloadReport } = useReports();
    const [filters, setFilters] = useState({});
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Reports" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Generate and download financial reports" })] }), _jsx(DownloadButton, { onDownloadPDF: () => downloadReport('latest', 'pdf'), onDownloadCSV: () => downloadReport('latest', 'csv') })] }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-3", children: [_jsx("div", { children: _jsx(ReportGenerator, { onGenerate: generateReport, isLoading: isLoading }) }), _jsxs("div", { className: "lg:col-span-2 space-y-4", children: [_jsx(ReportFilters, { filters: filters, onFilterChange: setFilters, onReset: () => setFilters({}) }), _jsx(ReportList, { reports: reports, onView: (id) => console.log('View', id), onDownload: (id) => downloadReport(id, 'pdf') })] })] })] }));
};
