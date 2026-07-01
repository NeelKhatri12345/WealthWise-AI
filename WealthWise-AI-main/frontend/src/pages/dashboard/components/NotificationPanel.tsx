/**
 * WealthWise AI — NotificationPanel
 *
 * Renders the list of DashboardNotification items with:
 *   - Independent loading skeleton
 *   - Error state + retry
 *   - Empty state (no notifications)
 */

import { memo } from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DashboardNotification } from "@/services/api/dashboard.api";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type NotifType = DashboardNotification["type"];

const typeConfig: Record<
  NotifType,
  { badge: "info" | "warning" | "success"; dot: string }
> = {
  info: { badge: "info", dot: "bg-blue-400" },
  alert: { badge: "warning", dot: "bg-amber-400" },
  success: { badge: "success", dot: "bg-green-400" },
};

function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-2">
          <Skeleton variant="circular" className="mt-0.5 h-2.5 w-2.5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function NotificationsEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-6 w-6 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4.214 3.227a.75.75 0 00-1.156-.956 8.97 8.97 0 00-1.856 3.826.75.75 0 001.466.316 7.47 7.47 0 011.546-3.186zm11.742-.956a.75.75 0 10-1.156.956 7.47 7.47 0 011.547 3.186.75.75 0 001.466-.316 8.971 8.971 0 00-1.857-3.826zM10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.076 32.94 32.94 0 003.256.508 3.5 3.5 0 006.972 0 32.933 32.933 0 003.256-.508.75.75 0 00.515-1.076A11.448 11.448 0 0116 8a6 6 0 00-6-6zm0 14.5a2 2 0 01-1.95-1.557 33.54 33.54 0 003.9 0A2 2 0 0110 16.5z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">
          You&apos;re all caught up
        </p>
        <p className="mt-0.5 text-xs text-wealth-muted">
          No new notifications right now.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single notification row
// ---------------------------------------------------------------------------

function NotificationRow({ notif }: { notif: DashboardNotification }) {
  const config = typeConfig[notif.type] ?? typeConfig.info;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50",
        !notif.read && "bg-blue-50/40 hover:bg-blue-50/60",
      )}
    >
      {/* Unread dot */}
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          notif.read ? "bg-gray-300" : config.dot,
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            notif.read
              ? "font-normal text-gray-700"
              : "font-semibold text-gray-900",
          )}
        >
          {notif.title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-wealth-muted">
          {notif.message}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={config.badge} size="sm">
          {notif.type}
        </Badge>
        <span className="text-[10px] text-wealth-muted">
          {formatRelativeTime(notif.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotificationPanel
// ---------------------------------------------------------------------------

interface NotificationPanelProps {
  notifications: DashboardNotification[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const NotificationPanel = memo(function NotificationPanel({
  notifications,
  loading = false,
  error = null,
  onRetry,
  className,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Card padding="none" className={className}>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Notifications</CardTitle>
          {!loading && !error && unreadCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
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
        {loading && !error && <NotificationSkeleton />}

        {/* Content */}
        {!loading && !error && (
          notifications.length === 0 ? (
            <NotificationsEmpty />
          ) : (
            <div className="space-y-0.5">
              {notifications.map((notif) => (
                <NotificationRow key={notif.id} notif={notif} />
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
});
