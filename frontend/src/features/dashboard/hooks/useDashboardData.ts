import { useState, useEffect } from 'react';

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

interface DashboardData {
  stats: DashboardStats | null;
  healthScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  riskScore: number;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    type: 'credit' | 'debit';
  }>;
  spendingData: Array<{ month: string; amount: number }>;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setData({
        stats: {
          totalBalance: 45230,
          monthlyIncome: 8500,
          monthlyExpenses: 5200,
          savingsRate: 38.8,
        },
        healthScore: 72,
        riskLevel: 'moderate',
        riskScore: 55,
        recentTransactions: [],
        spendingData: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
};
