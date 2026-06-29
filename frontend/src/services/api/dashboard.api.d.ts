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
export declare const dashboardApi: {
    getDashboardStats(): Promise<DashboardStatsResponse>;
    getRecentTransactions(): Promise<RecentTransactionResponse[]>;
    getWidgets(): Promise<WidgetResponse[]>;
};
