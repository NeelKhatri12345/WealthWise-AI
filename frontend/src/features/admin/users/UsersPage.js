import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { UserTable, UserFilters, UserDetail } from './components';
import { useUsers } from './hooks';
export const UsersPage = () => {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const { users, totalPages, isLoading, updateUserStatus } = useUsers(page, filters);
    const selectedUser = users.find((u) => u.id === selectedUserId);
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "User Management" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "View and manage all registered users" })] }), _jsx(UserFilters, { filters: filters, onFilterChange: setFilters, onReset: () => setFilters({}) }), isLoading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) })) : (_jsx(UserTable, { users: users, onUserClick: setSelectedUserId, currentPage: page, totalPages: totalPages, onPageChange: setPage })), selectedUser && (_jsx(UserDetail, { user: selectedUser, isOpen: !!selectedUserId, onClose: () => setSelectedUserId(null), onStatusChange: (status) => updateUserStatus(selectedUser.id, status) }))] }));
};
