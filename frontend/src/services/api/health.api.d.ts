export interface HealthScoreResponse {
  score: number;
  tips: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: "high" | "medium" | "low";
  }[];
}
export interface HealthHistoryItem {
  date: string;
  score: number;
}
export interface HealthMetricResponse {
  name: string;
  value: number;
  maxValue: number;
  status: "good" | "fair" | "poor";
  description: string;
}
export declare const healthApi: {
  getHealthScore(): Promise<HealthScoreResponse>;
  getHealthHistory(period?: string): Promise<HealthHistoryItem[]>;
  getHealthMetrics(): Promise<HealthMetricResponse[]>;
};
