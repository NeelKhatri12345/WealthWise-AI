/**
 * WealthWise AI — DashboardPage
 *
 * Fully Redux-driven. No mockData imports.
 *
 * Data flow:
 *   mount → dispatch(fetchDashboardAll())
 *         → four parallel thunks update independent sections
 *         → selectors feed per-section components
 *
 * Each section (Summary, Transactions, Insights, Notifications)
 * loads independently with its own skeleton → content → error path.
 */

import { useEffect, useCallback, type ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchDashboardAll,
  fetchDashboardSummary,
  fetchRecentTransactions,
  fetchDashboardInsights,
  fetchDashboardNotifications,
  selectDashboardSummary,
  selectDashboardTransactions,
  selectDashboardInsights,
  selectDashboardNotifications,
} from "@/store/slices/dashboardSlice";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/routes/routes";

import {
  DashboardHeader,
  StatCard,
  QuickActionCard,
  InsightCard,
  TransactionTable,
  ChartPlaceholder,
} from "./components";
import { NotificationPanel } from "./components/NotificationPanel";

// ---------------------------------------------------------------------------
// Static UI config (routing / labels / colours — never comes from the server)
// ---------------------------------------------------------------------------

const kpiIcons: ReactNode[] = [
  // Wallet — Total Balance
  <svg
    key="wallet"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v.495a.75.75 0 01-.002.009v6.497a.75.75 0 01.002.009v.99A2.5 2.5 0 0115.5 15h-11A2.5 2.5 0 012 12.5v-8zm12.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" />
  </svg>,
  // Arrow-up — Monthly Income
  <svg
    key="income"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.573a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-3.96V16.25A.75.75 0 0110 17z"
      clipRule="evenodd"
    />
  </svg>,
  // Arrow-down — Monthly Expenses
  <svg
    key="expenses"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 3a.75.75 0 01.75.75v10.638l3.96-3.96a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 3.96V3.75A.75.75 0 0110 3z"
      clipRule="evenodd"
    />
  </svg>,
  // Heart — Health Score
  <svg
    key="health"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.723.723 0 01-.692 0h-.002z" />
  </svg>,
];

interface QuickAction {
  label: string;
  description: string;
  to: string;
  iconBg: string;
  icon: ReactNode;
}

const quickActions: QuickAction[] = [
  {
    label: "Upload Statement",
    description: "Import bank or card statements",
    to: ROUTES.UPLOAD,
    iconBg: "bg-primary-50 text-primary-600",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
      </svg>
    ),
  },
  {
    label: "View Reports",
    description: "Monthly & yearly summaries",
    to: ROUTES.REPORTS,
    iconBg: "bg-violet-50 text-violet-600",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm2.5 1.5a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0v-3zm2.5-2.25a.75.75 0 00-1.5 0v5.25a.75.75 0 001.5 0V8z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: "AI Coach",
    description: "Personalized financial tips",
    to: ROUTES.AI_COACH,
    iconBg: "bg-amber-50 text-amber-600",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M10 1l.806 3.694a1 1 0 00.698.698L15.198 6.2l-3.694.806a1 1 0 00-.698.698L10 11.398l-.806-3.694a1 1 0 00-.698-.698L4.802 6.2l3.694-.806a1 1 0 00.698-.698L10 1z" />
        <path d="M5.5 10l.56 2.56a1 1 0 00.698.699L9.32 13.82l-2.56.56a1 1 0 00-.699.698L5.5 17.64l-.56-2.56a1 1 0 00-.699-.699L1.68 13.82l2.56-.56a1 1 0 00.699-.699L5.5 10z" />
      </svg>
    ),
  },
  {
    label: "Portfolio",
    description: "Investment allocation",
    to: ROUTES.PORTFOLIO,
    iconBg: "bg-green-50 text-green-600",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// KPI config driven from summary data
// ---------------------------------------------------------------------------

function formatCurrency(val: number): string {
  return `₹${val.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

// ---------------------------------------------------------------------------
// DashboardPage
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  useDocumentTitle("Dashboard");

  const dispatch = useAppDispatch();

  // Section selectors
  const summary = useAppSelector(selectDashboardSummary);
  const transactions = useAppSelector(selectDashboardTransactions);
  const insights = useAppSelector(selectDashboardInsights);
  const notifications = useAppSelector(selectDashboardNotifications);

  // Dispatch all four sections in parallel on first render
  useEffect(() => {
    dispatch(fetchDashboardAll());
  }, [dispatch]);

  // Per-section retry callbacks
  const retrySummary = useCallback(
    () => dispatch(fetchDashboardSummary()),
    [dispatch],
  );
  const retryTransactions = useCallback(
    () => dispatch(fetchRecentTransactions()),
    [dispatch],
  );
  const retryInsights = useCallback(
    () => dispatch(fetchDashboardInsights()),
    [dispatch],
  );
  const retryNotifications = useCallback(
    () => dispatch(fetchDashboardNotifications()),
    [dispatch],
  );

  // -------------------------------------------------------------------------
  // KPI stat cards derived from summary
  // -------------------------------------------------------------------------

  const kpiStats = [
    {
      title: "Total Balance",
      value: summary.data ? formatCurrency(summary.data.totalBalance) : "—",
      iconBg: "bg-primary-50 text-primary-600",
    },
    {
      title: "Monthly Income",
      value: summary.data ? formatCurrency(summary.data.monthlyIncome) : "—",
      iconBg: "bg-green-50 text-wealth-success",
    },
    {
      title: "Monthly Expenses",
      value: summary.data ? formatCurrency(summary.data.monthlyExpenses) : "—",
      iconBg: "bg-red-50 text-wealth-danger",
    },
    {
      title: "Health Score",
      value: summary.data
        ? `${summary.data.healthScore.toFixed(0)} / 100`
        : "—",
      iconBg: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* 1 — Welcome Banner */}
      <DashboardHeader />

      {/* 2 — KPI Cards (each independent with its own loading/error) */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiStats.map((stat, i) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={kpiIcons[i]}
              iconBg={stat.iconBg}
              loading={summary.loading}
              error={summary.error}
              onRetry={retrySummary}
            />
          ))}
        </div>
      </section>

      {/* 3 — Quick Actions (static, never fetched) */}
      <section aria-label="Quick actions">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.label}
              label={action.label}
              description={action.description}
              to={action.to}
              iconBg={action.iconBg}
              icon={action.icon}
            />
          ))}
        </div>
      </section>

      {/* 4 — AI Insights */}
      <InsightCard
        insights={insights.data}
        loading={insights.loading}
        error={insights.error}
        onRetry={retryInsights}
      />

      {/* 5 & 6 — Transactions + Spending Chart (2-column on desktop) */}
      <section
        aria-label="Financial details"
        className="grid grid-cols-1 gap-6 lg:grid-cols-5"
      >
        <TransactionTable
          transactions={transactions.data}
          loading={transactions.loading}
          error={transactions.error}
          onRetry={retryTransactions}
          className="lg:col-span-3"
        />
        <ChartPlaceholder className="lg:col-span-2" />
      </section>

      {/* 7 — Notifications panel */}
      <NotificationPanel
        notifications={notifications.data}
        loading={notifications.loading}
        error={notifications.error}
        onRetry={retryNotifications}
      />
    </div>
  );
}
