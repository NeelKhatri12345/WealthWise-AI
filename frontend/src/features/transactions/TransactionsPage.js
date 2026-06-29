import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { TransactionList, TransactionFilters, TransactionDetail, CategoryBreakdown, MonthlyTrend, TransactionSearch, } from './components';
import { useTransactions, useTransactionFilters } from './hooks';
export const TransactionsPage = () => {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTxnId, setSelectedTxnId] = useState(null);
    const { filters, setFilters, resetFilters } = useTransactionFilters();
    const { transactions, totalPages, isLoading } = useTransactions({
        page,
        search: searchQuery,
    });
    const selectedTransaction = transactions.find((t) => t.id === selectedTxnId);
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Transactions" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "View and manage your financial transactions" })] }), _jsx("div", { className: "flex flex-col gap-4 lg:flex-row", children: _jsx("div", { className: "flex-1", children: _jsx(TransactionSearch, { onSearch: setSearchQuery }) }) }), _jsx(TransactionFilters, { filters: filters, categories: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment'], onFilterChange: setFilters, onReset: resetFilters }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsx(CategoryBreakdown, { data: [] }), _jsx(MonthlyTrend, { data: [] })] }), isLoading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) })) : (_jsx(TransactionList, { transactions: transactions, currentPage: page, totalPages: totalPages, onPageChange: setPage, onTransactionClick: setSelectedTxnId })), selectedTransaction && (_jsx(TransactionDetail, { transaction: selectedTransaction, isOpen: !!selectedTxnId, onClose: () => setSelectedTxnId(null) }))] }));
};
