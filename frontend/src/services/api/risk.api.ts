import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface RiskProfileResponse {
  score: number;
  level: "low" | "moderate" | "high" | "very_high";
  summary: string;
  lastUpdated: string;
}

export interface RiskFactorResponse {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface RiskHistoryItem {
  date: string;
  score: number;
}

export interface AssessmentAnswer {
  questionId: string;
  answer: string;
}

export const riskApi = {
  async getRiskProfile(): Promise<RiskProfileResponse> {
    const { data } =
      await axiosInstance.get<ApiResponse<RiskProfileResponse>>(
        "/risk/profile",
      );
    return data.data;
  },

  async submitAssessment(
    answers: AssessmentAnswer[],
  ): Promise<RiskProfileResponse> {
    const { data } = await axiosInstance.post<ApiResponse<RiskProfileResponse>>(
      "/risk/assessment",
      { answers },
    );
    return data.data;
  },

  async getRiskHistory(): Promise<RiskHistoryItem[]> {
    const { data } =
      await axiosInstance.get<ApiResponse<RiskHistoryItem[]>>("/risk/history");
    return data.data;
  },

  async getRiskFactors(): Promise<RiskFactorResponse[]> {
    const { data } =
      await axiosInstance.get<ApiResponse<RiskFactorResponse[]>>(
        "/risk/factors",
      );
    return data.data;
  },
};
