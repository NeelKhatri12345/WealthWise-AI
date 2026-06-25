interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'buy' | 'sell' | 'hold' | 'rebalance';
  confidence: number;
  asset?: string;
}

interface RecommendationListProps {
  recommendations: Recommendation[];
  onAction?: (id: string) => void;
}

const typeStyles = {
  buy: { badge: 'bg-green-100 text-green-700', label: 'Buy' },
  sell: { badge: 'bg-red-100 text-red-700', label: 'Sell' },
  hold: { badge: 'bg-blue-100 text-blue-700', label: 'Hold' },
  rebalance: { badge: 'bg-purple-100 text-purple-700', label: 'Rebalance' },
};

export const RecommendationList = ({ recommendations, onAction }: RecommendationListProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">AI Recommendations</h3>

      {recommendations.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">
          No recommendations at this time
        </p>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const style = typeStyles[rec.type];
            return (
              <div
                key={rec.id}
                className="flex items-start gap-4 rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
              >
                <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
                  {style.label}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{rec.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Confidence: {rec.confidence}%
                    </span>
                    {rec.asset && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                        {rec.asset}
                      </span>
                    )}
                  </div>
                </div>
                {onAction && (
                  <button
                    onClick={() => onAction(rec.id)}
                    className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Details
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
