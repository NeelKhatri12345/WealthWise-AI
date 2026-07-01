import { useState, useEffect } from "react";

type RiskLevel = "low" | "moderate" | "high" | "very-high";

interface RiskProfileData {
  level: RiskLevel;
  score: number;
  factors: Array<{
    name: string;
    value: number;
    maxValue: number;
    description: string;
    status: "good" | "warning" | "danger";
  }>;
  history: Array<{ date: string; score: number; level: string }>;
  benchmarks: Array<{
    label: string;
    userValue: number;
    benchmarkValue: number;
    unit?: string;
  }>;
}

interface UseRiskProfileReturn {
  data: RiskProfileData | null;
  isLoading: boolean;
  error: string | null;
  submitAssessment: (answers: Record<string, string>) => Promise<void>;
  refetch: () => void;
}

export const useRiskProfile = (): UseRiskProfileReturn => {
  const [data, setData] = useState<RiskProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setData({
        level: "moderate",
        score: 55,
        factors: [
          {
            name: "Income Stability",
            value: 8,
            maxValue: 10,
            description: "Stable monthly income",
            status: "good",
          },
          {
            name: "Debt Level",
            value: 5,
            maxValue: 10,
            description: "Moderate debt level",
            status: "warning",
          },
          {
            name: "Savings Buffer",
            value: 7,
            maxValue: 10,
            description: "Good emergency fund",
            status: "good",
          },
          {
            name: "Spending Volatility",
            value: 4,
            maxValue: 10,
            description: "Variable monthly spending",
            status: "warning",
          },
        ],
        history: [],
        benchmarks: [
          {
            label: "Savings Rate",
            userValue: 38,
            benchmarkValue: 20,
            unit: "%",
          },
          {
            label: "Debt-to-Income",
            userValue: 22,
            benchmarkValue: 36,
            unit: "%",
          },
        ],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load risk profile",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitAssessment = async (answers: Record<string, string>) => {
    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    void answers;
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, submitAssessment, refetch: fetchData };
};
