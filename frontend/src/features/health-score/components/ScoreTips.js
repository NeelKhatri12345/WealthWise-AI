import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ScoreTips = ({ tips }) => {
    const impactColors = {
        high: 'border-l-green-500 bg-green-50',
        medium: 'border-l-yellow-500 bg-yellow-50',
        low: 'border-l-blue-500 bg-blue-50',
    };
    const impactLabels = {
        high: 'High Impact',
        medium: 'Medium Impact',
        low: 'Low Impact',
    };
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: "Improvement Tips" }), tips.length === 0 ? (_jsx("p", { className: "text-sm text-gray-500", children: "Great job! No major improvements needed." })) : (_jsx("div", { className: "space-y-3", children: tips.map((tip) => (_jsxs("div", { className: `rounded-lg border-l-4 p-4 ${impactColors[tip.impact]}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h4", { className: "text-sm font-semibold text-gray-900", children: tip.title }), _jsx("span", { className: "text-xs font-medium text-gray-500", children: impactLabels[tip.impact] })] }), _jsx("p", { className: "text-sm text-gray-600", children: tip.description }), _jsx("span", { className: "mt-2 inline-block rounded-full bg-white/60 px-2 py-0.5 text-xs text-gray-600", children: tip.category })] }, tip.id))) }))] }));
};
