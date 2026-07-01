/**
 * mockData.ts
 *
 * Compile-safe placeholder data used by DashboardPage until
 * Redux integration is complete in the next session.
 *
 * quickActions and kpiStats remain here permanently because they
 * are static UI config (routing / labels / colours) rather than
 * server data.
 *
 * recentTransactions is typed against DashboardTransaction so the
 * file compiles after TransactionTable was updated to use that shape.
 * It will be deleted when DashboardPage switches to Redux.
 */

import type { DashboardTransaction } from "@/services/api/dashboard.api";

import type { QuickActionCardProps } from "../components/QuickActionCard";
import type { StatCardProps } from "../components/StatCard";
import { ROUTES } from "@/routes/routes";

// ---------------------------------------------------------------------------
// KPI Stats (static UI config — always mock)
// ---------------------------------------------------------------------------

export const kpiStats: Omit<StatCardProps, "icon">[] = [
  {
    title: "Total Balance",
    value: "—",
    change: 0,
    iconBg: "bg-primary-50 text-primary-600",
  },
  {
    title: "Monthly Income",
    value: "—",
    change: 0,
    iconBg: "bg-green-50 text-wealth-success",
  },
  {
    title: "Monthly Expenses",
    value: "—",
    change: 0,
    iconBg: "bg-red-50 text-wealth-danger",
  },
  {
    title: "Health Score",
    value: "—",
    change: 0,
    iconBg: "bg-amber-50 text-amber-600",
  },
];

// ---------------------------------------------------------------------------
// Quick Actions (static UI routing config)
// ---------------------------------------------------------------------------

export const quickActions: Omit<QuickActionCardProps, "icon">[] = [
  {
    label: "Upload Statement",
    description: "Import bank or card statements",
    to: ROUTES.UPLOAD,
    iconBg: "bg-primary-50 text-primary-600",
  },
  {
    label: "View Reports",
    description: "Monthly & yearly summaries",
    to: ROUTES.REPORTS,
    iconBg: "bg-violet-50 text-violet-600",
  },
  {
    label: "AI Coach",
    description: "Personalized financial tips",
    to: ROUTES.AI_COACH,
    iconBg: "bg-amber-50 text-amber-600",
  },
  {
    label: "Portfolio",
    description: "Investment allocation",
    to: ROUTES.PORTFOLIO,
    iconBg: "bg-green-50 text-green-600",
  },
];

// ---------------------------------------------------------------------------
// Recent transactions placeholder (typed against API shape)
// Replaced by Redux state in the next integration step.
// ---------------------------------------------------------------------------

export const recentTransactions: DashboardTransaction[] = [];
