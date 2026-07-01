interface RiskFactor {
  name: string;
  value: number;
  maxValue: number;
  description: string;
  status: "good" | "warning" | "danger";
}

interface RiskFactorsProps {
  factors: RiskFactor[];
}

export const RiskFactors = ({ factors }: RiskFactorsProps) => {
  const statusStyles = {
    good: { bar: "bg-green-500", badge: "bg-green-100 text-green-700" },
    warning: { bar: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-700" },
    danger: { bar: "bg-red-500", badge: "bg-red-100 text-red-700" },
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Risk Factors</h3>

      <div className="space-y-4">
        {factors.map((factor) => {
          const pct = (factor.value / factor.maxValue) * 100;
          const style = statusStyles[factor.status];

          return (
            <div key={factor.name} className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {factor.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
                >
                  {factor.value}/{factor.maxValue}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${style.bar} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{factor.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
