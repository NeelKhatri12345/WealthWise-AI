import axiosInstance, { type ApiResponse } from "./axiosInstance";

// ── Types — aligned with backend RiskProfileResponse ──────────────────────────

export interface RiskProfileResponse {
  id: string;
  statement_id: string;
  risk_level: "low" | "moderate" | "high" | "very_high";
  risk_score: number;
  confidence: number | null;
  feature_inputs: Record<string, unknown> | null;
  calculated_at: string;
}

// ── API methods ───────────────────────────────────────────────────────────────

export const riskApi = {
  /** Fetch the latest ML-derived risk profile. */
  async getRiskProfile(): Promise<RiskProfileResponse> {
    const { data } = await axiosInstance.get<ApiResponse<RiskProfileResponse>>(
      "/risk-profile/latest",
    );
    return data.data;
  },

  /** Fetch risk profile history (most recent first). */
  async getRiskHistory(limit: number = 10): Promise<RiskProfileResponse[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<RiskProfileResponse[]>
    >("/risk-profile/history", { params: { limit } });
    return data.data;
  },
};
