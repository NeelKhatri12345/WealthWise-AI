import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ScoreDisplay = ({ score, maxScore = 100, label = 'Financial Health Score' }) => {
    const percentage = (score / maxScore) * 100;
    const circumference = 2 * Math.PI * 60;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const getColor = () => {
        if (percentage >= 75)
            return '#10B981';
        if (percentage >= 50)
            return '#F59E0B';
        return '#EF4444';
    };
    const getRating = () => {
        if (percentage >= 75)
            return 'Excellent';
        if (percentage >= 50)
            return 'Good';
        if (percentage >= 25)
            return 'Fair';
        return 'Needs Improvement';
    };
    return (_jsxs("div", { className: "flex flex-col items-center rounded-xl bg-white p-8 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-6 text-lg font-semibold text-gray-900", children: label }), _jsxs("div", { className: "relative", children: [_jsxs("svg", { className: "h-40 w-40 -rotate-90 transform", viewBox: "0 0 128 128", children: [_jsx("circle", { cx: "64", cy: "64", r: "60", fill: "none", stroke: "#E5E7EB", strokeWidth: "8" }), _jsx("circle", { cx: "64", cy: "64", r: "60", fill: "none", stroke: getColor(), strokeWidth: "8", strokeLinecap: "round", strokeDasharray: circumference, strokeDashoffset: strokeDashoffset, className: "transition-all duration-1000 ease-out" })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsx("span", { className: "text-4xl font-bold text-gray-900", children: score }), _jsxs("span", { className: "text-sm text-gray-500", children: ["/ ", maxScore] })] })] }), _jsx("p", { className: "mt-4 text-lg font-medium", style: { color: getColor() }, children: getRating() })] }));
};
