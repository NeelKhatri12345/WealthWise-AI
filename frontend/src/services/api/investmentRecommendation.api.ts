import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface AllocationItem {
  category: string;
  percentage: number;
  monthly_amount: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  rationale: string;
}

export interface ReasoningDetail {
  strategy_rationale: string;
  positive_signals: string[];
  negative_signals: string[];
  how_to_unlock: string[];
}

export interface ActionPlan {
  now: string[];
  three_months: string[];
  six_months: string[];
  one_year: string[];
}

export interface AllStrategies {
  conservative: { name: string; label: string; description: string; allocation: AllocationItem[] };
  balanced: { name: string; label: string; description: string; allocation: AllocationItem[] };
  aggressive: { name: string; label: string; description: string; allocation: AllocationItem[] };
}

export interface CalculationInputs {
  health_score: number;
  health_band: string;
  risk_level: string;
  monthly_income: number;
  monthly_expenses: number;
  monthly_emi: number;
  safety_buffer: number;
  safety_buffer_pct: number;
  emergency_months: number;
  has_emergency_fund: boolean;
  employment_type: string | null;
  income_stability: string | null;
  total_debt: number;
}

export interface InvestmentRecommendationSnapshot {
  id: string;
  user_id: string;
  health_score_snapshot_id: string | null;
  risk_profile_snapshot_id: string | null;
  investment_readiness: "READY" | "PARTIAL" | "NOT_READY";
  investment_readiness_score: number | null;
  recommended_strategy: "conservative" | "balanced" | "aggressive";
  monthly_investable_amount: number | null;
  allocation_json: AllocationItem[] | null;
  reasoning_json: ReasoningDetail | null;
  warnings_json: string[] | null;
  action_plan_json: ActionPlan | null;
  metadata_json: {
    all_strategies: AllStrategies;
    calculation_inputs: CalculationInputs;
  } | null;
  created_at: string;
}

export interface InvestmentHistoryItem {
  id: string;
  investment_readiness: string;
  investment_readiness_score: number | null;
  recommended_strategy: string;
  monthly_investable_amount: number | null;
  created_at: string;
}

// ─── Phase 2: Product Suggestions ────────────────────────────────────────────

export interface MarketData {
  expected_return_1y: number | null;
  expected_return_3y: number | null;
  expense_ratio: number | null;
  aum_cr: number | null;
  rating: number | null;
  volatility: "LOW" | "MEDIUM" | "HIGH" | null;
  last_updated: string | null;

  // M2 Additions - Stocks
  pe_ratio?: number | null;
  pb_ratio?: number | null;
  dividend_yield?: number | null;
  beta?: number | null;
  week_52_high?: number | null;
  week_52_low?: number | null;
  analyst_rating?: number | null;
  momentum_score?: number | null;
  liquidity_score?: number | null;
  market_cap_cr?: number | null;

  // M2 Additions - Mutual Funds
  exit_load?: string | null;
  riskometer?: string | null;
  category_avg_return?: number | null;
  tracking_error?: number | null;

  // M2 Additions - ETFs
  underlying_index?: string | null;
}


export interface MarketScores {
  overall_score: number;
  valuation_score: number;
  growth_score: number;
  volatility_score: number;
  liquidity_score: number;
  quality_score: number;
  cost_efficiency_score: number;
  consistency_score: number;
}

export interface ScoreBreakdown {
  risk_match: number;
  goal_match: number;
  horizon_match: number;
  market_score: number;
  expense_ratio_score: number;
  historical_performance_score: number;
  diversification: number;
  volatility_score: number;
  liquidity_score: number;
  health_score_compatibility: number;
  investment_readiness_compatibility: number;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  product_type: string;
  asset_class: string;
  fund_house: string | null;
  sector: string;
  investment_style: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  symbol: string | null;
  isin: string | null;
  amfi_code: string | null;
  confidence_pct: number;
  rank: number;
  match_reasons: string[];
  reason_tags: string[];
  regulatory_note: string;
  market_data: MarketData | null;
  market_scores?: MarketScores | null;

  // Phase 6 Transparency Extensions
  overall_fit_score: number;
  score_breakdown: ScoreBreakdown;
  recommendation_reason: string;
}


export interface CategorySuggestions {
  category: string;
  monthly_allocation: number | null;
  allocation_pct: number | null;
  products: ProductRecommendation[];
  note?: string;
}

export interface ProductSuggestionsResponse {
  strategy: "conservative" | "balanced" | "aggressive";
  investment_readiness: "READY" | "PARTIAL" | "NOT_READY";
  health_score: number;
  monthly_investable_amount: number;
  generated_at: string;
  data_source: "static_catalog" | "live";
  categories: CategorySuggestions[];
  supplementary_categories: CategorySuggestions[];
  providers?: string[];
  companies?: string[];
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export const investmentRecommendationApi = {
  async calculate(): Promise<InvestmentRecommendationSnapshot> {
    const { data } = await axiosInstance.post<ApiResponse<InvestmentRecommendationSnapshot>>(
      "/investments/recommendation/calculate"
    );
    return data.data;
  },

  async getLatest(): Promise<InvestmentRecommendationSnapshot | null> {
    const { data } = await axiosInstance.get<ApiResponse<InvestmentRecommendationSnapshot | null>>(
      "/investments/recommendation/latest"
    );
    return data.data;
  },

  async getHistory(limit = 10): Promise<InvestmentHistoryItem[]> {
    const { data } = await axiosInstance.get<ApiResponse<InvestmentHistoryItem[]>>(
      "/investments/recommendation/history",
      { params: { limit } }
    );
    return data.data;
  },

  async getProductSuggestions(params?: { sort_by?: string; provider?: string }): Promise<ProductSuggestionsResponse> {
    const { data } = await axiosInstance.get<ApiResponse<ProductSuggestionsResponse>>(
      "/investments/product-suggestions",
      { params }
    );
    return data.data;
  },
};

