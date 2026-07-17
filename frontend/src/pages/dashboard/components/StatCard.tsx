import { memo, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: ReactNode;
  iconBg?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  to?: string;
}


// ---------------------------------------------------------------------------
// Skeleton variant
// ---------------------------------------------------------------------------

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("", className)}>
      <div className="flex items-start justify-between">
        <Skeleton variant="rectangular" className="h-11 w-11 rounded-lg" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Error variant
// ---------------------------------------------------------------------------

function StatCardError({
  error,
  onRetry,
  className,
}: {
  error: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col items-center justify-center gap-2 py-6", className)}>
      <p className="text-xs text-wealth-danger">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-primary-600 underline hover:text-primary-700"
        >
          Retry
        </button>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main card
// ---------------------------------------------------------------------------

export const StatCard = memo(function StatCard({
  title,
  value,
  change,
  icon,
  iconBg = "bg-primary-50 text-primary-600",
  loading = false,
  error = null,
  onRetry,
  className,
  to,
}: StatCardProps) {
  if (loading) return <StatCardSkeleton className={className} />;
  if (error) return <StatCardError error={error} onRetry={onRetry} className={className} />;

  const isPositive = (change ?? 0) >= 0;

  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            iconBg,
          )}
        >
          {icon}
        </div>
        {change !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              isPositive
                ? "bg-green-50 text-wealth-success"
                : "bg-red-50 text-wealth-danger",
            )}
          >
            <svg
              className={cn("h-3 w-3", !isPositive && "rotate-180")}
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 2.5v7M6 2.5L2.5 6M6 2.5L9.5 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="mt-0.5 text-sm text-wealth-muted">{title}</p>
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          "block rounded-xl border border-wealth-border bg-wealth-card p-6 shadow-sm group transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer",
          className,
        )}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <Card
      className={cn(
        "group transition-shadow duration-200 hover:shadow-md",
        className,
      )}
    >
      {cardContent}
    </Card>
  );
});
