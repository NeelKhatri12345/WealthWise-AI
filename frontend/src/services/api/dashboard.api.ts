/**
 * WealthWise AI — Dashboard API Service
 *
 * Calls the four backend dashboard endpoints and returns
 * strongly-typed, camelCase responses for the Redux slice.
 *
 * Backend contract (snake_case → camelCase mapping done here):
 *   GET /dashboard/summary
 *   GET /dashboard/recent-transactions?limit=7
 *   GET /dashboard/insights
 *   GET /dashboard/notifications
 */

import axiosInstance, { type ApiResponse } from "./axiosInstance";

// ---------------------------------------------------------------------------
// Response types (match backend dashboard_schema.py exactly)
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  healthScore: number;
  healthScoreLabel: string;
  netWorth: number;
  transactionCount: number;
}

export interface DashboardTransaction {
  id: string;
  date: string;
  merchant: string | null;
  description: string;
  category: string | null;
  amount: number;
  transactionType: "credit" | "debit";
}

export interface DashboardInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "info" | "warning" | "success";
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "alert" | "success";
  read: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Raw backend shapes (snake_case) — used only for mapping
// ---------------------------------------------------------------------------

interface RawSummary {
  total_balance: string;
  monthly_income: string;
  monthly_expenses: string;
  savings_rate: string;
  health_score: string;
  health_score_label: string;
  net_worth: string;
  transaction_count: number;
}

interface RawTransaction {
  id: string;
  date: string;
  merchant: string | null;
  description: string;
  category: string | null;
  amount: string;
  transaction_type: "credit" | "debit";
}

interface RawInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "info" | "warning" | "success";
}

interface RawNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "alert" | "success";
  read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Mappers — snake_case → camelCase, Decimal strings → numbers
// ---------------------------------------------------------------------------

function mapSummary(raw: RawSummary): DashboardSummary {
  return {
    totalBalance: parseFloat(raw.total_balance),
    monthlyIncome: parseFloat(raw.monthly_income),
    monthlyExpenses: parseFloat(raw.monthly_expenses),
    savingsRate: parseFloat(raw.savings_rate),
    healthScore: parseFloat(raw.health_score),
    healthScoreLabel: raw.health_score_label,
    netWorth: parseFloat(raw.net_worth),
    transactionCount: raw.transaction_count,
  };
}

function mapTransaction(raw: RawTransaction): DashboardTransaction {
  return {
    id: raw.id,
    date: raw.date,
    merchant: raw.merchant,
    description: raw.description,
    category: raw.category,
    amount: parseFloat(raw.amount),
    transactionType: raw.transaction_type,
  };
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await axiosInstance.get<ApiResponse<RawSummary>>(
      "/dashboard/summary",
    );
    return mapSummary(data.data);
  },

  async getRecentTransactions(limit = 7): Promise<DashboardTransaction[]> {
    const { data } = await axiosInstance.get<ApiResponse<RawTransaction[]>>(
      "/dashboard/recent-transactions",
      { params: { limit } },
    );
    return data.data.map(mapTransaction);
  },

  async getInsights(): Promise<DashboardInsight[]> {
    const { data } = await axiosInstance.get<ApiResponse<RawInsight[]>>(
      "/dashboard/insights",
    );
    return data.data;
  },

  async getNotifications(): Promise<DashboardNotification[]> {
    const { data } = await axiosInstance.get<ApiResponse<RawNotification[]>>(
      "/dashboard/notifications",
    );
    return data.data.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.created_at,
    }));
  },
};
