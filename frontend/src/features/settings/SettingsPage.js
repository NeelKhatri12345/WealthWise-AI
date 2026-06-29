import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GeneralSettings, NotificationSettings, ThemeSettings, DataExport } from './components';
import { useSettings } from './hooks';
export const SettingsPage = () => {
    const { settings, isLoading, error, updateSettings, exportData } = useSettings();
    if (isLoading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) }));
    }
    if (error || !settings) {
        return (_jsx("div", { className: "rounded-lg bg-red-50 p-4 text-red-700", children: _jsx("p", { children: error ?? 'Failed to load settings' }) }));
    }
    return (_jsxs("div", { className: "mx-auto max-w-3xl space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Settings" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Customize your WealthWise experience" })] }), _jsx(GeneralSettings, { language: settings.language, currency: settings.currency, dateFormat: settings.dateFormat, onUpdate: (general) => updateSettings(general) }), _jsx(ThemeSettings, { currentTheme: settings.theme, onThemeChange: (theme) => updateSettings({ theme }) }), _jsx(NotificationSettings, { emailNotifications: settings.emailNotifications, pushNotifications: settings.pushNotifications, weeklyDigest: settings.weeklyDigest, onToggle: (key, enabled) => updateSettings({ [key]: enabled }) }), _jsx(DataExport, { onExportJSON: () => exportData('json'), onExportCSV: () => exportData('csv') })] }));
};
