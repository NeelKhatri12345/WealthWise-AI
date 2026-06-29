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
export declare const usePortfolio: () => UsePortfolioReturn;
export {};
