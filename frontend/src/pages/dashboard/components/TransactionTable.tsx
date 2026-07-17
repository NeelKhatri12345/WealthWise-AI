/**
 * WealthWise AI — TransactionTable
 *
 * Displays DashboardTransaction[] from Redux with:
 *   - Date, Merchant, Category, Amount, Transaction Type columns
 *   - Uses transaction_type (credit/debit) — no invented status field
 *   - Independent loading skeleton (5 rows)
 *   - Error state + retry
 *   - Professional empty state
 *   - Credit = green / Debit = red
 */

import { memo } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/routes/routes";
import type { DashboardTransaction } from "@/services/api/dashboard.api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TransactionTableProps {
  transactions: DashboardTransaction[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(amount: number, type: "credit" | "debit"): string {
  const abs = Math.abs(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return type === "credit" ? `+₹${abs}` : `-₹${abs}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Skeleton rows (5 placeholder rows while loading)
// ---------------------------------------------------------------------------

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-wealth-border">
          <td className="px-6 py-3.5">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="px-6 py-3.5">
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="hidden px-6 py-3.5 sm:table-cell">
            <Skeleton className="h-4 w-20" />
          </td>
          <td className="px-6 py-3.5 text-right">
            <Skeleton className="ml-auto h-4 w-20" />
          </td>
          <td className="hidden px-6 py-3.5 sm:table-cell">
            <Skeleton className="h-5 w-16 rounded-full" />
          </td>
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function TransactionsEmpty() {
  const navigate = useNavigate();
  return (
    <tr>
      <td colSpan={5} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center gap-3">
          {/* Receipt icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              No transactions yet
            </p>
            <p className="mt-0.5 text-xs text-wealth-muted">
              Upload a bank statement to see your recent activity.
            </p>
          </div>
          <button
            onClick={() => navigate(ROUTES.UPLOAD)}
            className="mt-1 rounded-lg bg-primary-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-600"
          >
            Upload Statement
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Transaction row
// ---------------------------------------------------------------------------

function TransactionRow({ txn }: { txn: DashboardTransaction }) {
  const isCredit = txn.transactionType === "credit";
  return (
    <tr className="transition-colors hover:bg-gray-50">
      {/* Date */}
      <td className="whitespace-nowrap px-6 py-3.5 text-sm text-wealth-muted">
        {formatDate(txn.date)}
      </td>

      {/* Merchant / Description */}
      <td className="max-w-[160px] truncate px-6 py-3.5 text-sm font-medium text-gray-900">
        {txn.merchant ?? txn.description}
      </td>

      {/* Category */}
      <td className="hidden px-6 py-3.5 text-sm text-wealth-muted sm:table-cell">
        {txn.category ?? "—"}
      </td>

      {/* Amount */}
      <td
        className={`whitespace-nowrap px-6 py-3.5 text-right text-sm font-semibold ${
          isCredit ? "text-wealth-success" : "text-wealth-danger"
        }`}
      >
        {formatAmount(txn.amount, txn.transactionType)}
      </td>

      {/* Transaction Type badge */}
      <td className="hidden px-6 py-3.5 sm:table-cell">
        <Badge variant={isCredit ? "success" : "danger"} size="sm">
          {isCredit ? "Credit" : "Debit"}
        </Badge>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TransactionTable = memo(function TransactionTable({
  transactions,
  loading = false,
  error = null,
  onRetry,
  className,
}: TransactionTableProps) {
  const navigate = useNavigate();

  return (
    <Card padding="none" className={className}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <button
          onClick={() => navigate(ROUTES.TRANSACTIONS)}
          className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          View all
        </button>
      </CardHeader>

      <CardContent className="px-0 py-0">
        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <svg
                className="h-5 w-5 text-wealth-danger"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-wealth-danger">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Table (shown while loading, showing skeleton rows, or with real data) */}
        {!error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-t border-wealth-border bg-gray-50/60 text-xs uppercase tracking-wider text-wealth-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Merchant</th>
                  <th className="hidden px-6 py-3 font-medium sm:table-cell">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                  <th className="hidden px-6 py-3 font-medium sm:table-cell">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wealth-border">
                {loading ? (
                  <SkeletonRows />
                ) : transactions.length === 0 ? (
                  <TransactionsEmpty />
                ) : (
                  transactions.map((txn) => (
                    <TransactionRow key={txn.id} txn={txn} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
