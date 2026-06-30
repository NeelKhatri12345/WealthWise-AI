interface HealthScoreData {
  score: number;
  maxScore: number;
  factors: Array<{
    name: string;
    score: number;
    maxScore: number;
    description: string;
  }>;
  history: Array<{
    date: string;
    score: number;
  }>;
  tips: Array<{
    id: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    category: string;
  }>;
}
interface UseHealthScoreReturn {
  data: HealthScoreData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
export declare const useHealthScore: () => UseHealthScoreReturn;
export {};
