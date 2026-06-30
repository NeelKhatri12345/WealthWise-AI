interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}
interface DashboardData {
  stats: DashboardStats | null;
  healthScore: number;
  riskLevel: "low" | "moderate" | "high" | "very-high";
  riskScore: number;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    type: "credit" | "debit";
  }>;
  spendingData: Array<{
    month: string;
    amount: number;
  }>;
}
interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
export declare const useDashboardData: () => UseDashboardDataReturn;
export {};
