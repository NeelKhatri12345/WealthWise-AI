interface MaintenanceModeProps {
  isEnabled: boolean;
  scheduledAt?: string;
  onToggle: (enabled: boolean) => void;
  onSchedule?: (dateTime: string) => void;
}

export const MaintenanceMode = ({
  isEnabled,
  scheduledAt,
  onToggle,
  onSchedule,
}: MaintenanceModeProps) => {
  return (
    <div
      className={`rounded-xl p-6 shadow-sm border ${isEnabled ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-white"}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Maintenance Mode
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {isEnabled
              ? "System is in maintenance mode. Users cannot access the application."
              : "Enable maintenance mode to temporarily restrict access."}
          </p>
          {scheduledAt && !isEnabled && (
            <p className="mt-1 text-xs text-amber-600">
              Scheduled: {scheduledAt}
            </p>
          )}
        </div>
        <button
          onClick={() => onToggle(!isEnabled)}
          className={`h-7 w-12 rounded-full transition-colors ${isEnabled ? "bg-amber-500" : "bg-gray-300"}`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${isEnabled ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>

      {!isEnabled && onSchedule && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Schedule Maintenance
          </label>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              onChange={(e) => onSchedule(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
