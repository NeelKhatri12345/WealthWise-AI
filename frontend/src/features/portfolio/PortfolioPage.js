import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AllocationChart, RecommendationList, AssetCard, PortfolioSummary, RebalanceAlert, } from './components';
import { usePortfolio } from './hooks';
export const PortfolioPage = () => {
    const { data, isLoading, error } = usePortfolio();
    if (isLoading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) }));
    }
    if (error || !data) {
        return (_jsx("div", { className: "rounded-lg bg-red-50 p-4 text-red-700", children: _jsx("p", { children: error ?? 'Failed to load portfolio' }) }));
    }
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Portfolio" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Manage your investments and view AI-powered recommendations" })] }), _jsx(PortfolioSummary, { totalValue: data.totalValue, totalChange: data.totalChange, totalChangePercent: data.totalChangePercent, assetCount: data.assets.length }), _jsx(RebalanceAlert, { suggestions: data.rebalanceSuggestions }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsx(AllocationChart, { data: data.allocation }), _jsx(RecommendationList, { recommendations: data.recommendations })] }), data.assets.length > 0 && (_jsxs("div", { children: [_jsx("h2", { className: "mb-4 text-lg font-semibold text-gray-900", children: "Your Assets" }), _jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: data.assets.map((asset) => (_jsx(AssetCard, { ...asset }, asset.name))) })] }))] }));
};
