import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SystemOverview, UserGrowthChart, ActiveUsersChart, RevenueChart, RecentActivity } from './components';
import { useAdminDashboard } from './hooks';
export const AdminDashboardPage = () => {
    const { data, isLoading, error } = useAdminDashboard();
    if (isLoading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) }));
    }
    if (error || !data) {
        return (_jsx("div", { className: "rounded-lg bg-red-50 p-4 text-red-700", children: _jsx("p", { children: error ?? 'Failed to load admin dashboard' }) }));
    }
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Admin Dashboard" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "System overview and key metrics" })] }), _jsx(SystemOverview, { stats: data.systemStats }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsx(UserGrowthChart, { data: data.userGrowth }), _jsx(ActiveUsersChart, { data: data.activeUsers })] }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsx(RevenueChart, { data: data.revenue }), _jsx(RecentActivity, { activities: data.recentActivity })] })] }));
};
