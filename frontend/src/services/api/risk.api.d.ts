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
export declare const riskApi: {
  getRiskProfile(): Promise<RiskProfileResponse>;
  submitAssessment(answers: AssessmentAnswer[]): Promise<RiskProfileResponse>;
  getRiskHistory(): Promise<RiskHistoryItem[]>;
  getRiskFactors(): Promise<RiskFactorResponse[]>;
};
