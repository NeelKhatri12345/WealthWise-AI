export interface DashboardStats {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    savingsRate: number;
    healthScore: number;
    transactionCount: number;
}
export interface RecentTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    type: 'credit' | 'debit';
}
export interface DashboardWidget {
    id: string;
    type: string;
    title: string;
    visible: boolean;
    order: number;
}
export interface DashboardState {
    stats: DashboardStats | null;
    recentTransactions: RecentTransaction[];
    widgets: DashboardWidget[];
    loading: boolean;
    error: string | null;
}
export declare const fetchDashboardData: import("@reduxjs/toolkit").AsyncThunk<{
    stats: import("../../services/api/dashboard.api").DashboardStatsResponse;
    transactions: import("../../services/api/dashboard.api").RecentTransactionResponse[];
    widgets: import("../../services/api/dashboard.api").WidgetResponse[];
}, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const refreshStats: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/dashboard.api").DashboardStatsResponse, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const clearDashboardError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"dashboard/clearDashboardError">;
declare const _default: import("redux").Reducer<DashboardState>;
export default _default;
