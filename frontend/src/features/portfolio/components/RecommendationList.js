import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const typeStyles = {
    buy: { badge: 'bg-green-100 text-green-700', label: 'Buy' },
    sell: { badge: 'bg-red-100 text-red-700', label: 'Sell' },
    hold: { badge: 'bg-blue-100 text-blue-700', label: 'Hold' },
    rebalance: { badge: 'bg-purple-100 text-purple-700', label: 'Rebalance' },
};
export const RecommendationList = ({ recommendations, onAction }) => {
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: "AI Recommendations" }), recommendations.length === 0 ? (_jsx("p", { className: "py-4 text-center text-sm text-gray-500", children: "No recommendations at this time" })) : (_jsx("div", { className: "space-y-3", children: recommendations.map((rec) => {
                    const style = typeStyles[rec.type];
                    return (_jsxs("div", { className: "flex items-start gap-4 rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors", children: [_jsx("span", { className: `mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`, children: style.label }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: rec.title }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: rec.description }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsxs("span", { className: "text-xs text-gray-500", children: ["Confidence: ", rec.confidence, "%"] }), rec.asset && (_jsx("span", { className: "rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600", children: rec.asset }))] })] }), onAction && (_jsx("button", { onClick: () => onAction(rec.id), className: "shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-500", children: "Details" }))] }, rec.id));
                }) }))] }));
};
