interface AssetCardProps {
  name: string;
  ticker?: string;
  value: number;
  allocation: number;
  change: number;
  changePercent: number;
}

export const AssetCard = ({
  name,
  ticker,
  value,
  allocation,
  change,
  changePercent,
}: AssetCardProps) => {
  const isPositive = change >= 0;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{name}</h4>
          {ticker && <p className="text-xs text-gray-500">{ticker}</p>}
        </div>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {allocation.toFixed(1)}%
        </span>
      </div>

      <p className="mt-3 text-xl font-bold text-gray-900">
        ${value.toLocaleString()}
      </p>

      <div className={`mt-1 flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <span>{isPositive ? '\u2191' : '\u2193'}</span>
        <span>${Math.abs(change).toLocaleString()}</span>
        <span>({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
      </div>
    </div>
  );
};
