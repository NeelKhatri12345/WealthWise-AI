import { useState, useEffect } from 'react';

interface PortfolioData {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  allocation: Array<{
    name: string;
    percentage: number;
    value: number;
    color?: string;
  }>;
  assets: Array<{
    name: string;
    ticker?: string;
    value: number;
    allocation: number;
    change: number;
    changePercent: number;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    type: 'buy' | 'sell' | 'hold' | 'rebalance';
    confidence: number;
    asset?: string;
  }>;
  rebalanceSuggestions: Array<{
    asset: string;
    currentAllocation: number;
    targetAllocation: number;
    action: 'increase' | 'decrease';
  }>;
}

interface UsePortfolioReturn {
  data: PortfolioData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePortfolio = (): UsePortfolioReturn => {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setData({
        totalValue: 125000,
        totalChange: 2340,
        totalChangePercent: 1.9,
        allocation: [
          { name: 'Stocks', percentage: 45, value: 56250, color: '#6366F1' },
          { name: 'Bonds', percentage: 25, value: 31250, color: '#10B981' },
          { name: 'Real Estate', percentage: 15, value: 18750, color: '#F59E0B' },
          { name: 'Cash', percentage: 15, value: 18750, color: '#6B7280' },
        ],
        assets: [],
        recommendations: [],
        rebalanceSuggestions: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
};
