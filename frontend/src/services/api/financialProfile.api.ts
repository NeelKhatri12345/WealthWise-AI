import axiosInstance, { type ApiResponse } from "./axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FinancialProfile {
  id: string;
  user_id: string;
  age_range: string | null;
  employment_type: string | null;
  monthly_income: number | null;
  family_income: number | null;
  earning_members: number | null;
  dependents_count: number | null;
  has_loans: boolean | null;
  loan_types: string[] | null;
  monthly_emi: number | null;
  total_debt: number | null;
  has_emergency_fund: boolean | null;
  emergency_fund_months: number | null;
  has_health_insurance: boolean | null;
  has_life_insurance: boolean | null;
  monthly_investment: number | null;
  investment_types: string[] | null;
  risk_comfort: string | null;
  financial_goals: string[] | null;
  income_stability: string | null;
  profile_completion_percentage: number;
}

export const financialProfileApi = {
  async getProfile(): Promise<FinancialProfile | null> {
    const { data } = await axiosInstance.get<ApiResponse<FinancialProfile | null>>(
      "/financial-profile",
    );
    return data.data;
  },

  async patchProfile(fields: Partial<FinancialProfile>): Promise<FinancialProfile> {
    const { data } = await axiosInstance.patch<ApiResponse<FinancialProfile>>(
      "/financial-profile",
      fields,
    );
    return data.data;
  },
};
