import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { WelcomeCard, QuickStats, RecentTransactions, HealthScoreWidget, RiskProfileWidget, SpendingChart, } from './components';
import { useDashboardData } from './hooks';
export const DashboardPage = () => {
    const { data, isLoading, error } = useDashboardData();
    if (isLoading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "rounded-lg bg-red-50 p-4 text-red-700", children: _jsxs("p", { children: ["Failed to load dashboard: ", error] }) }));
    }
    if (!data)
        return null;
    const quickStats = [
        {
            label: 'Total Balance',
            value: `$${data.stats?.totalBalance.toLocaleString() ?? '0'}`,
            change: 5.2,
            icon: _jsx("span", { className: "text-lg", children: "$" }),
        },
        {
            label: 'Monthly Income',
            value: `$${data.stats?.monthlyIncome.toLocaleString() ?? '0'}`,
            change: 2.1,
            icon: _jsx("span", { className: "text-lg", children: "\u2191" }),
        },
        {
            label: 'Monthly Expenses',
            value: `$${data.stats?.monthlyExpenses.toLocaleString() ?? '0'}`,
            change: -3.4,
            icon: _jsx("span", { className: "text-lg", children: "\u2193" }),
        },
        {
            label: 'Savings Rate',
            value: `${data.stats?.savingsRate ?? 0}%`,
            change: 1.8,
            icon: _jsx("span", { className: "text-lg", children: "%" }),
        },
    ];
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsx(WelcomeCard, { userName: "User", netWorth: data.stats?.totalBalance }), _jsx(QuickStats, { stats: quickStats }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-3", children: [_jsx("div", { className: "lg:col-span-2", children: _jsx(SpendingChart, { data: data.spendingData }) }), _jsxs("div", { className: "space-y-4", children: [_jsx(HealthScoreWidget, { score: data.healthScore }), _jsx(RiskProfileWidget, { riskLevel: data.riskLevel, riskScore: data.riskScore })] })] }), _jsx(RecentTransactions, { transactions: data.recentTransactions })] }));
};
