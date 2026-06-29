import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
const sizeClasses = {
    sm: "h-24 w-24 text-xl",
    md: "h-32 w-32 text-3xl",
    lg: "h-40 w-40 text-4xl",
};
function getScoreColor(score, max) {
    const pct = score / max;
    if (pct >= 0.8)
        return "text-wealth-success";
    if (pct >= 0.6)
        return "text-primary-500";
    if (pct >= 0.4)
        return "text-wealth-warning";
    return "text-wealth-danger";
}
export function ScoreGauge({ score, maxScore = 100, label, grade, size = "md", className }) {
    return (_jsxs("div", { className: cn("flex flex-col items-center", className), children: [_jsxs("div", { className: cn("flex flex-col items-center justify-center rounded-full border-4 border-current", sizeClasses[size], getScoreColor(score, maxScore)), children: [_jsx("span", { className: "font-bold", children: score }), grade && _jsx("span", { className: "text-xs font-medium opacity-75", children: grade })] }), label && _jsx("p", { className: "mt-2 text-sm text-wealth-muted", children: label })] }));
}
