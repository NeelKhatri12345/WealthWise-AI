interface NotificationPreference {
  key: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}

interface NotificationPreferencesProps {
  preferences: NotificationPreference[];
  onToggle: (key: string, channel: "email" | "push", enabled: boolean) => void;
  onSave?: () => void;
  isLoading?: boolean;
}

export const NotificationPreferences = ({
  preferences,
  onToggle,
  onSave,
  isLoading = false,
}: NotificationPreferencesProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Notification Preferences
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-medium text-gray-500 uppercase">
          <span>Type</span>
          <span className="w-16 text-center">Email</span>
          <span className="w-16 text-center">Push</span>
        </div>

        {preferences.map((pref) => (
          <div
            key={pref.key}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-2"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{pref.label}</p>
              <p className="text-xs text-gray-500">{pref.description}</p>
            </div>
            <div className="flex w-16 justify-center">
              <button
                onClick={() => onToggle(pref.key, "email", !pref.email)}
                className={`h-6 w-10 rounded-full transition-colors ${pref.email ? "bg-indigo-600" : "bg-gray-300"}`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${pref.email ? "translate-x-5" : "translate-x-1"}`}
                />
              </button>
            </div>
            <div className="flex w-16 justify-center">
              <button
                onClick={() => onToggle(pref.key, "push", !pref.push)}
                className={`h-6 w-10 rounded-full transition-colors ${pref.push ? "bg-indigo-600" : "bg-gray-300"}`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${pref.push ? "translate-x-5" : "translate-x-1"}`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {onSave && (
        <button
          onClick={onSave}
          disabled={isLoading}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Saving..." : "Save Preferences"}
        </button>
      )}
    </div>
  );
};
