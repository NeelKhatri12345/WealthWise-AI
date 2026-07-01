interface PortfolioSummaryProps {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  assetCount: number;
  lastUpdated?: string;
}

export const PortfolioSummary = ({
  totalValue,
  totalChange,
  totalChangePercent,
  assetCount,
  lastUpdated,
}: PortfolioSummaryProps) => {
  const isPositive = totalChange >= 0;

  return (
    <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-indigo-200">Total Portfolio Value</p>
          <p className="mt-1 text-3xl font-bold">
            ${totalValue.toLocaleString()}
          </p>
          <div
            className={`mt-2 flex items-center gap-1 text-sm ${isPositive ? "text-green-300" : "text-red-300"}`}
          >
            <span>{isPositive ? "\u2191" : "\u2193"}</span>
            <span>${Math.abs(totalChange).toLocaleString()}</span>
            <span>
              ({isPositive ? "+" : ""}
              {totalChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-indigo-200">{assetCount} Assets</p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-indigo-300">
              Updated: {lastUpdated}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
