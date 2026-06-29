import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ScoreBreakdown = ({ factors }) => {
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: "Score Breakdown" }), _jsx("div", { className: "space-y-4", children: factors.map((factor) => {
                    const percentage = (factor.score / factor.maxScore) * 100;
                    const color = percentage >= 75
                        ? 'bg-green-500'
                        : percentage >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500';
                    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: factor.name }), _jsxs("span", { className: "text-sm font-semibold text-gray-900", children: [factor.score, "/", factor.maxScore] })] }), _jsx("div", { className: "h-2 w-full rounded-full bg-gray-200", children: _jsx("div", { className: `h-2 rounded-full ${color} transition-all`, style: { width: `${percentage}%` } }) }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: factor.description })] }, factor.name));
                }) })] }));
};
