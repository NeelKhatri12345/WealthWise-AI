interface BenchmarkData {
  label: string;
  userValue: number;
  benchmarkValue: number;
  unit?: string;
}

interface RiskComparisonProps {
  benchmarks: BenchmarkData[];
}

export const RiskComparison = ({ benchmarks }: RiskComparisonProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Benchmark Comparison
      </h3>

      <div className="space-y-4">
        {benchmarks.map((benchmark) => {
          const userPct = Math.min(
            100,
            (benchmark.userValue /
              Math.max(benchmark.userValue, benchmark.benchmarkValue)) *
              100,
          );
          const benchPct = Math.min(
            100,
            (benchmark.benchmarkValue /
              Math.max(benchmark.userValue, benchmark.benchmarkValue)) *
              100,
          );

          return (
            <div key={benchmark.label} className="rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-sm font-medium text-gray-900">
                {benchmark.label}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs text-gray-500">You</span>
                  <div className="flex-1 h-3 rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${userPct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs font-medium text-gray-900">
                    {benchmark.userValue}
                    {benchmark.unit ?? ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs text-gray-500">Average</span>
                  <div className="flex-1 h-3 rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-gray-400 transition-all"
                      style={{ width: `${benchPct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs font-medium text-gray-900">
                    {benchmark.benchmarkValue}
                    {benchmark.unit ?? ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
