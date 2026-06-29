import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const HealthScoreWidget = ({ score, maxScore = 100, trend = 'stable', onClick, }) => {
    const percentage = (score / maxScore) * 100;
    const getScoreColor = () => {
        if (percentage >= 75)
            return 'text-green-600';
        if (percentage >= 50)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    const getProgressColor = () => {
        if (percentage >= 75)
            return 'bg-green-500';
        if (percentage >= 50)
            return 'bg-yellow-500';
        return 'bg-red-500';
    };
    const trendIcons = {
        up: '\u2191',
        down: '\u2193',
        stable: '\u2192',
    };
    return (_jsxs("button", { onClick: onClick, className: "w-full rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500", children: "Financial Health" }), _jsx("span", { className: `text-sm ${getScoreColor()}`, children: trendIcons[trend] })] }), _jsxs("p", { className: `text-3xl font-bold ${getScoreColor()}`, children: [score, _jsxs("span", { className: "text-lg text-gray-400", children: ["/", maxScore] })] }), _jsx("div", { className: "mt-3 h-2 w-full rounded-full bg-gray-200", children: _jsx("div", { className: `h-2 rounded-full ${getProgressColor()} transition-all`, style: { width: `${percentage}%` } }) })] }));
};
