/**
 * WealthWise AI — Financial Analysis API
 *
 * Wraps:
 *   POST /ai-coach/analyze  → analyzeStatement(statementId)
 *   POST /ai-coach/chat     → chatWithCoach(summary, question, currency)
 */

import axiosInstance, { type ApiResponse } from "./axiosInstance";

// ---------------------------------------------------------------------------
// Sub-types mirroring financial_analysis_schema.py
// ---------------------------------------------------------------------------

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
}

export interface TopIncomeSource {
  description: string;
  amount: number;
  count: number;
}

export interface MonthlyCashFlow {
  month: string;   // "YYYY-MM"
  income: number;
  expense: number;
  savings: number;
}

export interface RecurringPayment {
  description: string;
  average_amount: number;
  months_detected: number;
  frequency: string;
}

export interface TransactionSummaryItem {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
}

export interface StatementPeriod {
  start: string;
  end: string;
}

export interface StructuredRecommendation {
  title: string;
  description: string;
  emoji: string;
}

export interface FinancialSummary {
  statement_id: string;
  generated_at: string;

  total_income: number;
  total_expense: number;
  net_savings: number;
  savings_rate: number;
  transaction_count: number;

  average_credit: number;
  average_debit: number;

  highest_expense: TransactionSummaryItem | null;
  highest_income: TransactionSummaryItem | null;

  top_expense_categories: CategoryExpense[];
  top_income_sources: TopIncomeSource[];
  most_frequent_merchant: string | null;

  monthly_cash_flow: MonthlyCashFlow[];
  spending_trend: string;
  income_trend: string;

  salary_detected: boolean;
  investment_detected: boolean;
  loan_detected: boolean;

  recurring_payments: RecurringPayment[];

  atm_withdrawals_total: number;
  upi_transactions_total: number;
  neft_transactions_total: number;
  imps_transactions_total: number;
  rtgs_transactions_total: number;
  bank_charges_total: number;
  weekend_spending_total: number;

  large_transactions: TransactionSummaryItem[];

  health_score: number;
  statement_period: StatementPeriod | null;
  recommendations: string[];
  structured_recommendations?: StructuredRecommendation[];
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const financialAnalysisApi = {
  /**
   * Trigger backend analysis of a completed statement.
   * The backend reads processing_metadata.extracted_data, normalizes rows,
   * and returns a FinancialSummary — no raw transactions cross the wire.
   */
  async analyzeStatement(statementId: string): Promise<FinancialSummary> {
    const { data } = await axiosInstance.post<
      ApiResponse<{ summary: FinancialSummary }>
    >("/ai-coach/analyze", { statement_id: statementId });
    return data.data.summary;
  },

  /**
   * Send a user question together with the FinancialSummary to the
   * stateless Gemini coaching endpoint.
   */
  async chatWithCoach(
    summary: FinancialSummary,
    question: string,
    currency = "INR",
  ): Promise<{ reply: string; tokens_used: number | null }> {
    const { data } = await axiosInstance.post<
      ApiResponse<{ reply: string; tokens_used: number | null }>
    >("/ai-coach/chat", {
      financial_summary: summary,
      user_question: question,
      currency,
    });
    return data.data;
  },
};
