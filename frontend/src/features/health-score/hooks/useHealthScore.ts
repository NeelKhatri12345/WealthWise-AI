import { useState, useEffect } from 'react';

interface HealthScoreData {
  score: number;
  maxScore: number;
  factors: Array<{
    name: string;
    score: number;
    maxScore: number;
    description: string;
  }>;
  history: Array<{ date: string; score: number }>;
  tips: Array<{
    id: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: string;
  }>;
}

interface UseHealthScoreReturn {
  data: HealthScoreData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useHealthScore = (): UseHealthScoreReturn => {
  const [data, setData] = useState<HealthScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setData({
        score: 72,
        maxScore: 100,
        factors: [
          { name: 'Savings Rate', score: 18, maxScore: 25, description: 'You save 38% of income' },
          { name: 'Debt Ratio', score: 20, maxScore: 25, description: 'Low debt-to-income ratio' },
          { name: 'Spending Pattern', score: 16, maxScore: 25, description: 'Consistent monthly spending' },
          { name: 'Investment Diversity', score: 18, maxScore: 25, description: 'Well-diversified portfolio' },
        ],
        history: [],
        tips: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health score');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
};
