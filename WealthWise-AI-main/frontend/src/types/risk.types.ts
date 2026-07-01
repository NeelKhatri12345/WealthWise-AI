export interface RiskProfile {
  level: "conservative" | "moderate" | "aggressive";
  score: number;
  factors: RiskFactor[];
  lastAssessed: string;
  recommendation: string;
}

export interface RiskFactor {
  id: string;
  name: string;
  impact: "low" | "medium" | "high";
  score: number;
  description: string;
}

export interface RiskAssessment {
  id: string;
  questions: RiskQuestion[];
  completedAt: string;
  result: RiskProfile;
}

export interface RiskQuestion {
  id: string;
  question: string;
  options: { label: string; value: number }[];
  selectedValue?: number;
}
