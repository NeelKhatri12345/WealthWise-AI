interface SystemMetric {
  label: string;
  value: number;
  maxValue: number;
  unit: string;
  status: "normal" | "warning" | "critical";
}

interface SystemMonitorProps {
  metrics: SystemMetric[];
}

export const SystemMonitor = ({ metrics }: SystemMonitorProps) => {
  const barColor = (status: SystemMetric["status"]) => {
    switch (status) {
      case "normal":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        System Resources
      </h3>

      <div className="space-y-4">
        {metrics.map((metric) => {
          const pct = (metric.value / metric.maxValue) * 100;
          return (
            <div key={metric.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {metric.label}
                </span>
                <span className="text-sm text-gray-500">
                  {metric.value}
                  {metric.unit} / {metric.maxValue}
                  {metric.unit}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                  className={`h-3 rounded-full ${barColor(metric.status)} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
