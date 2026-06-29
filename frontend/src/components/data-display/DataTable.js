import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Table } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";
export function DataTable({ columns, data, keyExtractor, isLoading, currentPage, totalPages, onPageChange, onRowClick, emptyMessage, className, }) {
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(Spinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: className, children: [_jsx(Table, { columns: columns, data: data, keyExtractor: keyExtractor, onRowClick: onRowClick, emptyMessage: emptyMessage }), currentPage && totalPages && totalPages > 1 && onPageChange && (_jsx("div", { className: "mt-4 flex justify-center", children: _jsx(Pagination, { currentPage: currentPage, totalPages: totalPages, onPageChange: onPageChange }) }))] }));
}
