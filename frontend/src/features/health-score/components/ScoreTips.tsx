interface Tip {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
}

interface ScoreTipsProps {
  tips: Tip[];
}

export const ScoreTips = ({ tips }: ScoreTipsProps) => {
  const impactColors = {
    high: 'border-l-green-500 bg-green-50',
    medium: 'border-l-yellow-500 bg-yellow-50',
    low: 'border-l-blue-500 bg-blue-50',
  };

  const impactLabels = {
    high: 'High Impact',
    medium: 'Medium Impact',
    low: 'Low Impact',
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Improvement Tips</h3>

      {tips.length === 0 ? (
        <p className="text-sm text-gray-500">Great job! No major improvements needed.</p>
      ) : (
        <div className="space-y-3">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className={`rounded-lg border-l-4 p-4 ${impactColors[tip.impact]}`}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-900">{tip.title}</h4>
                <span className="text-xs font-medium text-gray-500">
                  {impactLabels[tip.impact]}
                </span>
              </div>
              <p className="text-sm text-gray-600">{tip.description}</p>
              <span className="mt-2 inline-block rounded-full bg-white/60 px-2 py-0.5 text-xs text-gray-600">
                {tip.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
