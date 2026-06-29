import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const typeStyles = {
    info: { dot: 'bg-blue-500', bg: 'bg-blue-50' },
    warning: { dot: 'bg-yellow-500', bg: 'bg-yellow-50' },
    success: { dot: 'bg-green-500', bg: 'bg-green-50' },
    error: { dot: 'bg-red-500', bg: 'bg-red-50' },
};
export const NotificationItem = ({ title, message, type, read, createdAt, onMarkRead, onDelete, }) => {
    const style = typeStyles[type];
    return (_jsxs("div", { className: `flex items-start gap-3 px-6 py-4 ${!read ? style.bg : 'hover:bg-gray-50'} transition-colors`, children: [_jsx("div", { className: `mt-1.5 h-2 w-2 shrink-0 rounded-full ${!read ? style.dot : 'bg-transparent'}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: `text-sm ${!read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`, children: title }), _jsx("p", { className: "mt-0.5 text-sm text-gray-600 truncate", children: message }), _jsx("p", { className: "mt-1 text-xs text-gray-400", children: createdAt })] }), _jsxs("div", { className: "flex shrink-0 gap-2", children: [!read && onMarkRead && (_jsx("button", { onClick: onMarkRead, className: "text-xs text-indigo-600 hover:text-indigo-500", children: "Mark read" })), onDelete && (_jsx("button", { onClick: onDelete, className: "text-xs text-gray-400 hover:text-red-600", children: "Delete" }))] })] }));
};
