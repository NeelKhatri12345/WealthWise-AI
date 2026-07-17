import {
  AllocationChart,
  RecommendationList,
  AssetCard,
  PortfolioSummary,
  RebalanceAlert,
} from "./components";
import { usePortfolio } from "./hooks";

export const PortfolioPage = () => {
  const { data, isLoading, error } = usePortfolio();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p>{error ?? "Failed to load portfolio"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your investments and view AI-powered recommendations
        </p>
      </div>

      <PortfolioSummary
        totalValue={data.totalValue}
        totalChange={data.totalChange}
        totalChangePercent={data.totalChangePercent}
        assetCount={data.assets.length}
      />

      <RebalanceAlert suggestions={data.rebalanceSuggestions} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AllocationChart data={data.allocation} />
        <RecommendationList recommendations={data.recommendations} />
      </div>

      {data.assets.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Your Assets
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.assets.map((asset) => (
              <AssetCard key={asset.name} {...asset} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
