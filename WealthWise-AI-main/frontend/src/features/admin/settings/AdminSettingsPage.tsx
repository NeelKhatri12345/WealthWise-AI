import { SystemConfig, MaintenanceMode, BackupSettings } from "./components";
import { useAdminSettings } from "./hooks";

export const AdminSettingsPage = () => {
  const {
    data,
    isLoading,
    error,
    toggleMaintenance,
    updateConfig,
    saveConfigs,
    triggerBackup,
    updateBackupFrequency,
  } = useAdminSettings();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p>{error ?? "Failed to load admin settings"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage system configuration and maintenance
        </p>
      </div>

      <MaintenanceMode
        isEnabled={data.maintenanceMode}
        scheduledAt={data.scheduledMaintenance}
        onToggle={toggleMaintenance}
      />

      <SystemConfig
        configs={data.configs}
        onUpdate={updateConfig}
        onSave={saveConfigs}
      />

      <BackupSettings
        backup={data.backup}
        onBackupNow={triggerBackup}
        onFrequencyChange={updateBackupFrequency}
      />
    </div>
  );
};
