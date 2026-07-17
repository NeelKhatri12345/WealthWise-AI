interface ActivityItem {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  type: "user" | "system" | "security";
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const typeIcons = {
  user: "\uD83D\uDC64",
  system: "\u2699\uFE0F",
  security: "\uD83D\uDD12",
};

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500">
          No recent activity
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 px-6 py-3"
            >
              <span className="text-lg">{typeIcons[activity.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">
                  {activity.user} &middot; {activity.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
