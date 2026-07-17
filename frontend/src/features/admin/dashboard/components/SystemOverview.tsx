interface SystemStat {
  label: string;
  value: string | number;
  status: "healthy" | "warning" | "critical";
  icon?: React.ReactNode;
}

interface SystemOverviewProps {
  stats: SystemStat[];
}

const statusStyles = {
  healthy: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  critical: "bg-red-100 text-red-700",
};

export const SystemOverview = ({ stats }: SystemOverviewProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            {stat.icon && <div className="text-gray-400">{stat.icon}</div>}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[stat.status]}`}
            >
              {stat.status}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-sm text-gray-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};
