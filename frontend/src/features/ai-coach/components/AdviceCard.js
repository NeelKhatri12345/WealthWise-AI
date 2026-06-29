import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const AdviceCard = ({ title, description, category, actionLabel = 'Learn More', onAction, }) => {
    return (_jsxs("div", { className: "rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-5 border border-indigo-100", children: [_jsx("span", { className: "rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700", children: category }), _jsx("h4", { className: "mt-2 text-sm font-semibold text-gray-900", children: title }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: description }), onAction && (_jsxs("button", { onClick: onAction, className: "mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors", children: [actionLabel, " \u2192"] }))] }));
};
