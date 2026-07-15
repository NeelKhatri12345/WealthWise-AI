import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface HealthScoreBreakdown {
  savings_rate: number;
  expense_ratio: number;
  cash_flow: number;
  spending_behaviour: number;
  income_stability: number;
  transaction_diversity: number;
  financial_discipline: number;
}

export interface HealthScoreDetailResponse {
  score: number;
  grade: string;
  status: string;
  breakdown: HealthScoreBreakdown;
  strengths: string[];
  recommendations: string[];
  notes: string[];
}

// ── Hybrid snapshot types ──────────────────────────────────────────────────────

export interface ComponentScores {
  cash_flow_score: number;
  savings_score: number;
  spending_score: number;
  debt_burden_score: number;
  emergency_score: number;
  income_stability_score: number;
  investment_readiness_score: number;
}

export interface HealthScoreSnapshot {
  id: string;
  user_id: string;
  financial_profile_id: string | null;
  score: number;
  band: "EXCELLENT" | "GOOD" | "FAIR" | "WEAK" | "CRITICAL";
  risk_profile: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE" | null;
  component_scores: ComponentScores;
  positive_factors: string[];
  negative_factors: string[];
  suggestions: string[];
  calculation_metadata: Record<string, unknown> | null;
  created_at: string;
}

// ── API methods ────────────────────────────────────────────────────────────────

export const healthApi = {
  async getHealthScore(): Promise<HealthScoreDetailResponse> {
    const { data } =
      await axiosInstance.get<ApiResponse<HealthScoreDetailResponse>>(
        "/health-score/latest",
      );
    return data.data;
  },

  async getHealthHistory(period: string = "6m"): Promise<HealthScoreDetailResponse[]> {
    const { data } = await axiosInstance.get<ApiResponse<HealthScoreDetailResponse[]>>(
      "/health-score/history",
      { params: { period } },
    );
    return data.data;
  },

  async getHealthScoreByStatement(statementId: string): Promise<HealthScoreDetailResponse> {
    const { data } = await axiosInstance.get<ApiResponse<HealthScoreDetailResponse>>(
      `/health-score/${statementId}`,
    );
    return data.data;
  },

  /** Run the hybrid scoring engine and persist a snapshot. */
  async calculateScore(): Promise<HealthScoreSnapshot> {
    const { data } = await axiosInstance.post<ApiResponse<HealthScoreSnapshot>>(
      "/health-score/calculate",
    );
    return data.data;
  },

  /** Fetch the most recently persisted hybrid snapshot. */
  async getLatestSnapshot(): Promise<HealthScoreSnapshot> {
    const { data } = await axiosInstance.get<ApiResponse<HealthScoreSnapshot>>(
      "/health-score/snapshot/latest",
    );
    return data.data;
  },
};

