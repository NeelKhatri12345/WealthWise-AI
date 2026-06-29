import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ChartLegend = ({ items, onToggle, layout = 'horizontal', className = '', }) => {
    const containerClass = layout === 'horizontal'
        ? 'flex flex-wrap items-center gap-4'
        : 'flex flex-col gap-2';
    return (_jsx("div", { className: `${containerClass} ${className}`, children: items.map((item, index) => (_jsxs("button", { onClick: () => onToggle?.(index), className: `flex items-center gap-2 text-sm transition-opacity ${item.active === false ? 'opacity-40' : 'opacity-100'} ${onToggle ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`, children: [_jsx("span", { className: "inline-block w-3 h-3 rounded-full flex-shrink-0", style: { backgroundColor: item.color } }), _jsx("span", { className: "text-slate-600 font-medium", children: item.name }), item.value !== undefined && (_jsx("span", { className: "text-slate-800 font-semibold", children: item.value }))] }, item.name))) }));
};
export default ChartLegend;
