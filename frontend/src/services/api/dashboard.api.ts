import axiosInstance, { type ApiResponse } from './axiosInstance';

export interface DashboardStatsResponse {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
  healthScore: number;
  transactionCount: number;
}

export interface RecentTransactionResponse {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'credit' | 'debit';
}

export interface WidgetResponse {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  order: number;
}

export const dashboardApi = {
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    const { data } = await axiosInstance.get<
      ApiResponse<DashboardStatsResponse>
    >('/dashboard/stats');
    return data.data;
  },

  async getRecentTransactions(): Promise<RecentTransactionResponse[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<RecentTransactionResponse[]>
    >('/dashboard/recent-transactions');
    return data.data;
  },

  async getWidgets(): Promise<WidgetResponse[]> {
    const { data } = await axiosInstance.get<ApiResponse<WidgetResponse[]>>(
      '/dashboard/widgets'
    );
    return data.data;
  },
};
