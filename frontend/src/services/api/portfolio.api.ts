import axiosInstance, { type ApiResponse } from './axiosInstance';

export interface RecommendationResponse {
  id: string;
  assetClass: string;
  instrument: string;
  action: 'buy' | 'sell' | 'hold';
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

export const portfolioApi = {
  async getRecommendations(): Promise<RecommendationResponse[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<RecommendationResponse[]>
    >('/portfolio/recommendations');
    return data.data;
  },

  async getAllocations(): Promise<AllocationResponse[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<AllocationResponse[]>
    >('/portfolio/allocations');
    return data.data;
  },

  async getPortfolioSummary(): Promise<PortfolioSummaryResponse> {
    const { data } = await axiosInstance.get<
      ApiResponse<PortfolioSummaryResponse>
    >('/portfolio/summary');
    return data.data;
  },
};
