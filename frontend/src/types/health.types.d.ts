export interface HealthScore {
  overall: number;
  grade: "A" | "B" | "C" | "D" | "F";
  metrics: HealthMetric[];
  lastUpdated: string;
  trend: "improving" | "stable" | "declining";
}
export interface HealthMetric {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  category: "savings" | "debt" | "spending" | "investment" | "emergency";
  description: string;
  recommendation: string;
}
export interface HealthHistory {
  date: string;
  score: number;
  grade: string;
}
