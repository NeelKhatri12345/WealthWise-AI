/**
 * WealthWise AI — InsightCard
 *
 * Renders DashboardInsight[] with:
 *   - Independent loading skeleton (2 placeholder rows)
 *   - Error state + retry
 *   - Professional empty state
 *   - Optional priority badge per insight
 *   - Severity-coded icon + badge
 */

import { memo } from "react";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DashboardInsight } from "@/services/api/dashboard.api";

// ---------------------------------------------------------------------------
// Extended insight type — priority is optional, may not come from the backend
// ---------------------------------------------------------------------------

export type InsightWithPriority = DashboardInsight & {
  priority?: "high" | "medium" | "low";
};

// ---------------------------------------------------------------------------
// Severity → colour map
// ---------------------------------------------------------------------------

const severityStyles: Record<
  DashboardInsight["severity"],
  { icon: string; badge: "warning" | "danger" | "success" }
> = {
  info: {
    icon: "bg-amber-50 text-amber-500",
    badge: "warning",
  },
  warning: {
    icon: "bg-red-50 text-red-500",
    badge: "danger",
  },
  success: {
    icon: "bg-green-50 text-green-600",
    badge: "success",
  },
};

const priorityConfig: Record<
  NonNullable<InsightWithPriority["priority"]>,
  { label: string; variant: "danger" | "warning" | "neutral" }
> = {
  high: { label: "High Priority", variant: "danger" },
  medium: { label: "Medium Priority", variant: "warning" },
  low: { label: "Low Priority", variant: "neutral" },
};

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function InsightsEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
        <svg
          className="h-7 w-7 text-amber-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.5 17a.5.5 0 00.5.5h2a.5.5 0 00.5-.5v-.5h-3v.5zM8.5 19a.5.5 0 00.5.5h2a.5.5 0 000-1H9a.5.5 0 00-.5.5z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">
          No insights yet
        </p>
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-wealth-muted">
          Upload a bank statement to unlock personalized AI-powered financial
          insights.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single insight row
// ---------------------------------------------------------------------------

function InsightRow({ insight }: { insight: InsightWithPriority }) {
  const styles = severityStyles[insight.severity] ?? severityStyles.info;
  const priorityCfg = insight.priority ? priorityConfig[insight.priority] : null;

  return (
    <div className="flex items-start gap-4">
      {/* Severity icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.5 17a.5.5 0 00.5.5h2a.5.5 0 00.5-.5v-.5h-3v.5zM8.5 19a.5.5 0 00.5.5h2a.5.5 0 000-1H9a.5.5 0 00-.5.5z" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        {/* Title row with badges */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {insight.title}
          </h3>
          <Badge variant={styles.badge} size="sm">
            {insight.severity}
          </Badge>
          {/* Priority badge — only rendered when present */}
          {priorityCfg && (
            <Badge variant={priorityCfg.variant} size="sm">
              {priorityCfg.label}
            </Badge>
          )}
        </div>

        <p className="mt-1 text-sm leading-relaxed text-wealth-muted">
          {insight.description}
        </p>

        {/* Category pill */}
        {insight.category && (
          <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
            {insight.category}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InsightCard
// ---------------------------------------------------------------------------

interface InsightCardProps {
  insights: DashboardInsight[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const InsightCard = memo(function InsightCard({
  insights,
  loading = false,
  error = null,
  onRetry,
  className,
}: InsightCardProps) {
  return (
    <Card padding="none" className={className}>
      <div className="px-6 py-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">AI Insights</h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            AI
          </span>
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
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

        {/* Loading skeleton */}
        {loading && !error && (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton variant="rectangular" className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="space-y-5">
            {insights.length === 0 ? (
              <InsightsEmpty />
            ) : (
              insights.map((insight) => (
                <InsightRow key={insight.id} insight={insight} />
              ))
            )}
          </div>
        )}
      </div>
    </Card>
  );
});
