import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const typeIcons = {
    user: '\uD83D\uDC64',
    system: '\u2699\uFE0F',
    security: '\uD83D\uDD12',
};
export const RecentActivity = ({ activities }) => {
    return (_jsxs("div", { className: "rounded-xl bg-white shadow-sm border border-gray-100", children: [_jsx("div", { className: "border-b border-gray-100 px-6 py-4", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Recent Activity" }) }), activities.length === 0 ? (_jsx("p", { className: "p-6 text-center text-sm text-gray-500", children: "No recent activity" })) : (_jsx("div", { className: "divide-y divide-gray-100", children: activities.map((activity) => (_jsxs("div", { className: "flex items-center gap-3 px-6 py-3", children: [_jsx("span", { className: "text-lg", children: typeIcons[activity.type] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-gray-900", children: activity.action }), _jsxs("p", { className: "text-xs text-gray-500", children: [activity.user, " \u00B7 ", activity.timestamp] })] })] }, activity.id))) }))] }));
};
