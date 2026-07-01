interface ErrorEntry {
  id: string;
  message: string;
  source: string;
  timestamp: string;
  severity: "error" | "warning" | "critical";
  count: number;
}

interface ErrorLogProps {
  errors: ErrorEntry[];
  onViewDetail?: (id: string) => void;
}

const severityStyles = {
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
  critical: "bg-red-200 text-red-800",
};

export const ErrorLog = ({ errors, onViewDetail }: ErrorLogProps) => {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Errors</h3>
      </div>

      {errors.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-green-600 font-medium">No recent errors</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {errors.map((err) => (
            <div
              key={err.id}
              onClick={() => onViewDetail?.(err.id)}
              className="flex items-start gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${severityStyles[err.severity]}`}
              >
                {err.severity}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {err.message}
                </p>
                <p className="text-xs text-gray-500">
                  {err.source} &middot; {err.timestamp}
                  {err.count > 1 && <> &middot; {err.count} occurrences</>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
