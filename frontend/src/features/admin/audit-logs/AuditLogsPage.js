import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AuditTable, AuditFilters, AuditDetail } from './components';
import { useAuditLogs } from './hooks';
export const AuditLogsPage = () => {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({});
    const [selectedEntryId, setSelectedEntryId] = useState(null);
    const { entries, totalPages, isLoading } = useAuditLogs(page, filters);
    const selectedEntry = entries.find((e) => e.id === selectedEntryId);
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Audit Logs" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Track all system actions and user activity" })] }), _jsx(AuditFilters, { filters: filters, onFilterChange: setFilters, onReset: () => setFilters({}) }), isLoading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) })) : (_jsx(AuditTable, { entries: entries, currentPage: page, totalPages: totalPages, onPageChange: setPage, onEntryClick: setSelectedEntryId })), selectedEntry && (_jsx(AuditDetail, { entry: selectedEntry, isOpen: !!selectedEntryId, onClose: () => setSelectedEntryId(null) }))] }));
};
