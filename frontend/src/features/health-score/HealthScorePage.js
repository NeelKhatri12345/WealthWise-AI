import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ScoreDisplay, ScoreBreakdown, ScoreHistory, ScoreTips, MetricCard } from './components';
import { useHealthScore } from './hooks';
export const HealthScorePage = () => {
    const { data, isLoading, error } = useHealthScore();
    if (isLoading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) }));
    }
    if (error || !data) {
        return (_jsx("div", { className: "rounded-lg bg-red-50 p-4 text-red-700", children: _jsx("p", { children: error ?? 'Failed to load health score' }) }));
    }
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Financial Health Score" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Track and improve your overall financial wellbeing" })] }), _jsxs("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-4", children: [_jsx(MetricCard, { label: "Savings Rate", value: "38.8%", trend: { direction: 'up', value: '+2.1% this month' } }), _jsx(MetricCard, { label: "Debt Ratio", value: "22%", trend: { direction: 'down', value: '-1.5% this month' } }), _jsx(MetricCard, { label: "Emergency Fund", value: "4.2 months", trend: { direction: 'stable', value: 'No change' } }), _jsx(MetricCard, { label: "Investment Return", value: "8.5%", trend: { direction: 'up', value: '+0.3% this quarter' } })] }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-3", children: [_jsx(ScoreDisplay, { score: data.score, maxScore: data.maxScore }), _jsx("div", { className: "lg:col-span-2", children: _jsx(ScoreBreakdown, { factors: data.factors }) })] }), _jsx(ScoreHistory, { data: data.history }), _jsx(ScoreTips, { tips: data.tips })] }));
};
