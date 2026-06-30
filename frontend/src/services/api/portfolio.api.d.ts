export interface RecommendationResponse {
  id: string;
  assetClass: string;
  instrument: string;
  action: "buy" | "sell" | "hold";
  currentAllocation: number;
  targetAllocation: number;
  rationale: string;
  confidence: number;
}
export interface AllocationResponse {
  assetClass: string;
  currentValue: number;
  currentPercentage: number;
  targetPercentage: number;
  difference: number;
}
export interface PortfolioSummaryResponse {
  totalValue: number;
  totalReturn: number;
  returnPercentage: number;
  lastUpdated: string;
}
export declare const portfolioApi: {
  getRecommendations(): Promise<RecommendationResponse[]>;
  getAllocations(): Promise<AllocationResponse[]>;
  getPortfolioSummary(): Promise<PortfolioSummaryResponse>;
};
