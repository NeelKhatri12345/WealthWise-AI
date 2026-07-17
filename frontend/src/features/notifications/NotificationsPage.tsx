import { NotificationList, NotificationPreferences } from "./components";
import { useNotifications } from "./hooks";

const defaultPreferences = [
  {
    key: "transactions",
    label: "Transactions",
    description: "New transaction alerts",
    email: true,
    push: true,
  },
  {
    key: "health_score",
    label: "Health Score",
    description: "Score changes and tips",
    email: true,
    push: false,
  },
  {
    key: "risk_alerts",
    label: "Risk Alerts",
    description: "Risk profile changes",
    email: true,
    push: true,
  },
  {
    key: "reports",
    label: "Reports",
    description: "Report generation complete",
    email: false,
    push: true,
  },
  {
    key: "system",
    label: "System",
    description: "System updates and maintenance",
    email: true,
    push: false,
  },
];

export const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your alerts and notification preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NotificationList
            notifications={notifications}
            onMarkRead={markAsRead}
            onMarkAllRead={markAllAsRead}
            onDelete={deleteNotification}
          />
        </div>
        <div>
          <NotificationPreferences
            preferences={defaultPreferences}
            onToggle={(key, channel, enabled) => {
              console.log("Toggle", key, channel, enabled);
            }}
          />
        </div>
      </div>
    </div>
  );
};
