interface NotificationSettingsProps {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  onToggle: (
    key: "emailNotifications" | "pushNotifications" | "weeklyDigest",
    enabled: boolean,
  ) => void;
}

export const NotificationSettings = ({
  emailNotifications,
  pushNotifications,
  weeklyDigest,
  onToggle,
}: NotificationSettingsProps) => {
  const toggles = [
    {
      key: "emailNotifications" as const,
      label: "Email Notifications",
      description: "Receive alerts via email",
      value: emailNotifications,
    },
    {
      key: "pushNotifications" as const,
      label: "Push Notifications",
      description: "Browser push notifications",
      value: pushNotifications,
    },
    {
      key: "weeklyDigest" as const,
      label: "Weekly Digest",
      description: "Weekly summary of your finances",
      value: weeklyDigest,
    },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Notifications
      </h3>

      <div className="space-y-4">
        {toggles.map((toggle) => (
          <div key={toggle.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {toggle.label}
              </p>
              <p className="text-xs text-gray-500">{toggle.description}</p>
            </div>
            <button
              onClick={() => onToggle(toggle.key, !toggle.value)}
              className={`h-6 w-10 rounded-full transition-colors ${toggle.value ? "bg-indigo-600" : "bg-gray-300"}`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${toggle.value ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
