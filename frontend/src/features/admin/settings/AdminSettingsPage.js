import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SystemConfig, MaintenanceMode, BackupSettings } from './components';
import { useAdminSettings } from './hooks';
export const AdminSettingsPage = () => {
    const { data, isLoading, error, toggleMaintenance, updateConfig, saveConfigs, triggerBackup, updateBackupFrequency, } = useAdminSettings();
    if (isLoading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) }));
    }
    if (error || !data) {
        return (_jsx("div", { className: "rounded-lg bg-red-50 p-4 text-red-700", children: _jsx("p", { children: error ?? 'Failed to load admin settings' }) }));
    }
    return (_jsxs("div", { className: "mx-auto max-w-3xl space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Admin Settings" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Manage system configuration and maintenance" })] }), _jsx(MaintenanceMode, { isEnabled: data.maintenanceMode, scheduledAt: data.scheduledMaintenance, onToggle: toggleMaintenance }), _jsx(SystemConfig, { configs: data.configs, onUpdate: updateConfig, onSave: saveConfigs }), _jsx(BackupSettings, { backup: data.backup, onBackupNow: triggerBackup, onFrequencyChange: updateBackupFrequency })] }));
};
