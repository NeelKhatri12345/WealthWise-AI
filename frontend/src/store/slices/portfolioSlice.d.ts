export interface Recommendation {
    id: string;
    assetClass: string;
    instrument: string;
    action: 'buy' | 'sell' | 'hold';
    currentAllocation: number;
    targetAllocation: number;
    rationale: string;
    confidence: number;
}
export interface Allocation {
    assetClass: string;
    currentValue: number;
    currentPercentage: number;
    targetPercentage: number;
    difference: number;
}
export interface PortfolioSummary {
    totalValue: number;
    totalReturn: number;
    returnPercentage: number;
    lastUpdated: string;
}
export interface PortfolioState {
    recommendations: Recommendation[];
    allocations: Allocation[];
    summary: PortfolioSummary | null;
    loading: boolean;
    error: string | null;
}
export declare const fetchPortfolio: import("@reduxjs/toolkit").AsyncThunk<{
    allocations: import("../../services/api/portfolio.api").AllocationResponse[];
    summary: import("../../services/api/portfolio.api").PortfolioSummaryResponse;
}, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const fetchRecommendations: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/portfolio.api").RecommendationResponse[], void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const clearPortfolioError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"portfolio/clearPortfolioError">;
declare const _default: import("redux").Reducer<PortfolioState>;
export default _default;
