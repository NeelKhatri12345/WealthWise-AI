interface RebalanceSuggestion {
  asset: string;
  currentAllocation: number;
  targetAllocation: number;
  action: 'increase' | 'decrease';
}

interface RebalanceAlertProps {
  suggestions: RebalanceSuggestion[];
  onRebalance?: () => void;
  onDismiss?: () => void;
}

export const RebalanceAlert = ({ suggestions, onRebalance, onDismiss }: RebalanceAlertProps) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full bg-amber-100 p-2">
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900">Rebalancing Recommended</h3>
          <p className="mt-1 text-sm text-amber-700">
            Your portfolio has drifted from target allocations.
          </p>

          <div className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <div key={s.asset} className="flex items-center justify-between text-sm">
                <span className="text-amber-900">{s.asset}</span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600">{s.currentAllocation}%</span>
                  <span className="text-amber-400">&rarr;</span>
                  <span className="font-medium text-amber-900">{s.targetAllocation}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            {onRebalance && (
              <button
                onClick={onRebalance}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
              >
                View Rebalance Plan
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
