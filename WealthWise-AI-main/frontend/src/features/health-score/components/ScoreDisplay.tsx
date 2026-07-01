interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  label?: string;
}

export const ScoreDisplay = ({
  score,
  maxScore = 100,
  label = "Financial Health Score",
}: ScoreDisplayProps) => {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 75) return "#10B981";
    if (percentage >= 50) return "#F59E0B";
    return "#EF4444";
  };

  const getRating = () => {
    if (percentage >= 75) return "Excellent";
    if (percentage >= 50) return "Good";
    if (percentage >= 25) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div className="flex flex-col items-center rounded-xl bg-white p-8 shadow-sm border border-gray-100">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">{label}</h3>

      <div className="relative">
        <svg className="h-40 w-40 -rotate-90 transform" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r="60"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
          />
          <circle
            cx="64"
            cy="64"
            r="60"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900">{score}</span>
          <span className="text-sm text-gray-500">/ {maxScore}</span>
        </div>
      </div>

      <p className="mt-4 text-lg font-medium" style={{ color: getColor() }}>
        {getRating()}
      </p>
    </div>
  );
};
