interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { direction: "up" | "down" | "stable"; value: string };
  icon?: React.ReactNode;
}

export const MetricCard = ({
  label,
  value,
  subtitle,
  trend,
  icon,
}: MetricCardProps) => {
  const trendColor =
    trend?.direction === "up"
      ? "text-green-600"
      : trend?.direction === "down"
        ? "text-red-600"
        : "text-gray-500";

  const trendArrow =
    trend?.direction === "up"
      ? "\u2191"
      : trend?.direction === "down"
        ? "\u2193"
        : "\u2192";

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className={`mt-3 flex items-center gap-1 text-sm ${trendColor}`}>
          <span>{trendArrow}</span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
};
