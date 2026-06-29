import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const NotificationSettings = ({ emailNotifications, pushNotifications, weeklyDigest, onToggle, }) => {
    const toggles = [
        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive alerts via email', value: emailNotifications },
        { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser push notifications', value: pushNotifications },
        { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Weekly summary of your finances', value: weeklyDigest },
    ];
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: "Notifications" }), _jsx("div", { className: "space-y-4", children: toggles.map((toggle) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: toggle.label }), _jsx("p", { className: "text-xs text-gray-500", children: toggle.description })] }), _jsx("button", { onClick: () => onToggle(toggle.key, !toggle.value), className: `h-6 w-10 rounded-full transition-colors ${toggle.value ? 'bg-indigo-600' : 'bg-gray-300'}`, children: _jsx("span", { className: `block h-4 w-4 rounded-full bg-white shadow transition-transform ${toggle.value ? 'translate-x-5' : 'translate-x-1'}` }) })] }, toggle.key))) })] }));
};
