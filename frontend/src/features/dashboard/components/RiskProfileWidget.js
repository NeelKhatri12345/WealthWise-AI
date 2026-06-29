import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const riskConfig = {
    low: { label: 'Low Risk', color: 'text-green-700', bgColor: 'bg-green-100' },
    moderate: { label: 'Moderate', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    high: { label: 'High Risk', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    'very-high': { label: 'Very High', color: 'text-red-700', bgColor: 'bg-red-100' },
};
export const RiskProfileWidget = ({ riskLevel, riskScore, onClick }) => {
    const config = riskConfig[riskLevel];
    return (_jsxs("button", { onClick: onClick, className: "w-full rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 mb-2", children: "Risk Profile" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: `rounded-full px-3 py-1 text-sm font-medium ${config.color} ${config.bgColor}`, children: config.label }), _jsx("span", { className: "text-2xl font-bold text-gray-900", children: riskScore })] }), _jsx("p", { className: "mt-2 text-xs text-gray-500", children: "Based on your financial analysis" })] }));
};
