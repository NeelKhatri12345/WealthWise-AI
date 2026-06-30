interface ScoreFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

interface ScoreBreakdownProps {
  factors: ScoreFactor[];
}

export const ScoreBreakdown = ({ factors }: ScoreBreakdownProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Score Breakdown
      </h3>

      <div className="space-y-4">
        {factors.map((factor) => {
          const percentage = (factor.score / factor.maxScore) * 100;
          const color =
            percentage >= 75
              ? "bg-green-500"
              : percentage >= 50
                ? "bg-yellow-500"
                : "bg-red-500";

          return (
            <div key={factor.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {factor.name}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {factor.score}/{factor.maxScore}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${color} transition-all`}
                  style={{ width: `${percentage}%` }}
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
