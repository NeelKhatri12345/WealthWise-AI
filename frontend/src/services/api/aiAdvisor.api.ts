import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface AIAdvisorAdviceResponse {
  financial_summary: string;
  current_strengths: string[];
  potential_risks: string[];
  investment_insights: string;
  recommended_next_steps: string[];
  long_term_opportunities: string;
  important_considerations: string;
}

export const aiAdvisorApi = {
  async query(question: string): Promise<AIAdvisorAdviceResponse> {
    const { data } = await axiosInstance.post<ApiResponse<AIAdvisorAdviceResponse>>(
      "/ai-advisor/query",
      { question }
    );
    return data.data;
  },
};
