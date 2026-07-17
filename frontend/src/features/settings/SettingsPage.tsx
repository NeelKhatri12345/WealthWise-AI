import {
  GeneralSettings,
  NotificationSettings,
  ThemeSettings,
  DataExport,
} from "./components";
import { useSettings } from "./hooks";

export const SettingsPage = () => {
  const { settings, isLoading, error, updateSettings, exportData } =
    useSettings();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p>{error ?? "Failed to load settings"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Customize your WealthWise experience
        </p>
      </div>

      <GeneralSettings
        language={settings.language}
        currency={settings.currency}
        dateFormat={settings.dateFormat}
        onUpdate={(general) => updateSettings(general)}
      />

      <ThemeSettings
        currentTheme={settings.theme}
        onThemeChange={(theme) => updateSettings({ theme })}
      />

      <NotificationSettings
        emailNotifications={settings.emailNotifications}
        pushNotifications={settings.pushNotifications}
        weeklyDigest={settings.weeklyDigest}
        onToggle={(key, enabled) => updateSettings({ [key]: enabled })}
      />

      <DataExport
        onExportJSON={() => exportData("json")}
        onExportCSV={() => exportData("csv")}
      />
    </div>
  );
};
