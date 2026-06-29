import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const statusStyles = {
    healthy: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    critical: 'bg-red-100 text-red-700',
};
export const SystemOverview = ({ stats }) => {
    return (_jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", children: stats.map((stat) => (_jsxs("div", { className: "rounded-xl bg-white p-5 shadow-sm border border-gray-100", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [stat.icon && _jsx("div", { className: "text-gray-400", children: stat.icon }), _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[stat.status]}`, children: stat.status })] }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: stat.value }), _jsx("p", { className: "text-sm text-gray-500", children: stat.label })] }, stat.label))) }));
};
