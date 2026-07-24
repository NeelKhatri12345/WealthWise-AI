import type { ServiceMonitorItem } from "@/services/api/admin.api";

interface SystemMonitoringPanelProps {
  services: ServiceMonitorItem[];
  checkedAt: string | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function StatusBadge({ status }: { status: ServiceMonitorItem["status"] }) {
  const isOnline = status === "online";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isOnline
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-red-50 text-red-700 ring-1 ring-red-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`}
        aria-hidden="true"
      />
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}

function formatCheckedAt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SystemMonitoringPanel({
  services,
  checkedAt,
  loading = false,
  error = null,
  onRetry,
}: SystemMonitoringPanelProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-wealth-border bg-gray-50"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 font-medium text-red-800 underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {checkedAt && (
        <p className="text-xs text-wealth-muted">
          Last checked: {formatCheckedAt(checkedAt)}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between gap-3 rounded-xl border border-wealth-border bg-white p-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {service.label}
              </p>
              {service.latency_ms != null && service.status === "online" && (
                <p className="text-xs text-wealth-muted">
                  {service.latency_ms.toFixed(0)} ms
                </p>
              )}
              {service.status === "offline" && service.message && (
                <p className="truncate text-xs text-red-600" title={service.message}>
                  {service.message}
                </p>
              )}
            </div>
            <StatusBadge status={service.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
