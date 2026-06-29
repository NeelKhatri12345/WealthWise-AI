import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const riskLevels = {
    low: { label: 'Low Risk', color: '#10B981', position: 20 },
    moderate: { label: 'Moderate', color: '#F59E0B', position: 40 },
    high: { label: 'High Risk', color: '#F97316', position: 65 },
    'very-high': { label: 'Very High', color: '#EF4444', position: 85 },
};
export const RiskGauge = ({ level, score, maxScore = 100 }) => {
    const config = riskLevels[level];
    const percentage = (score / maxScore) * 100;
    return (_jsxs("div", { className: "flex flex-col items-center rounded-xl bg-white p-8 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-6 text-lg font-semibold text-gray-900", children: "Risk Level" }), _jsxs("div", { className: "relative w-full max-w-xs", children: [_jsx("div", { className: "h-4 w-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-red-500" }), _jsx("div", { className: "absolute -top-1 h-6 w-1 rounded-full bg-gray-900 shadow-md transition-all duration-700", style: { left: `${percentage}%` } })] }), _jsxs("div", { className: "mt-6 text-center", children: [_jsx("span", { className: "inline-block rounded-full px-4 py-1.5 text-sm font-semibold text-white", style: { backgroundColor: config.color }, children: config.label }), _jsx("p", { className: "mt-2 text-3xl font-bold text-gray-900", children: score }), _jsxs("p", { className: "text-sm text-gray-500", children: ["out of ", maxScore] })] })] }));
};
