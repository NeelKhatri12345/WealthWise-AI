export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  healthScore: number;
  monthOverMonthChange: number;
  topCategory: string;
  transactionCount: number;
}

export interface DashboardWidget {
  id: string;
  type: "chart" | "stat" | "list" | "progress";
  title: string;
  data: unknown;
  position: { row: number; col: number };
  size: { width: number; height: number };
}

export interface SpendingTrend {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}
