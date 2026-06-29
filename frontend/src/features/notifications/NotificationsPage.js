import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NotificationList, NotificationPreferences } from './components';
import { useNotifications } from './hooks';
const defaultPreferences = [
    { key: 'transactions', label: 'Transactions', description: 'New transaction alerts', email: true, push: true },
    { key: 'health_score', label: 'Health Score', description: 'Score changes and tips', email: true, push: false },
    { key: 'risk_alerts', label: 'Risk Alerts', description: 'Risk profile changes', email: true, push: true },
    { key: 'reports', label: 'Reports', description: 'Report generation complete', email: false, push: true },
    { key: 'system', label: 'System', description: 'System updates and maintenance', email: true, push: false },
];
export const NotificationsPage = () => {
    const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Notifications" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Manage your alerts and notification preferences" })] }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-3", children: [_jsx("div", { className: "lg:col-span-2", children: _jsx(NotificationList, { notifications: notifications, onMarkRead: markAsRead, onMarkAllRead: markAllAsRead, onDelete: deleteNotification }) }), _jsx("div", { children: _jsx(NotificationPreferences, { preferences: defaultPreferences, onToggle: (key, channel, enabled) => {
                                console.log('Toggle', key, channel, enabled);
                            } }) })] })] }));
};
