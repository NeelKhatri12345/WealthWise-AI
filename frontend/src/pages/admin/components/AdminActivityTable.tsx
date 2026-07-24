import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  adminApi,
  type ActivityLogItem,
  type ActivityTypeOption,
} from "@/services/api/admin.api";

const PAGE_SIZE = 10;

const activityBadgeVariant = (type: string) => {
  switch (type) {
    case "login":
      return "success" as const;
    case "logout":
      return "warning" as const;
    case "statement_upload":
      return "info" as const;
    case "investment_plan_generation":
      return "default" as const;
    case "ai_chat":
      return "info" as const;
    case "profile_update":
      return "default" as const;
    default:
      return "default" as const;
  }
};

function formatActivityLabel(type: string, types: ActivityTypeOption[]): string {
  return types.find((t) => t.value === type)?.label ?? type.replace(/_/g, " ");
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AdminActivityTableProps {
  compact?: boolean;
}

export function AdminActivityTable({ compact = false }: AdminActivityTableProps) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeOption[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState("");
  const [activityType, setActivityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadFilters = useCallback(async () => {
    try {
      const [types, userResult] = await Promise.all([
        adminApi.getActivityTypes(),
        adminApi.getUsers({ limit: 100 }),
      ]);
      setActivityTypes(types);
      setUsers(userResult.users);
    } catch {
      // Filters are optional — table still works without them
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getActivityLogs({
        skip: (page - 1) * PAGE_SIZE,
        limit: compact ? 5 : PAGE_SIZE,
        user_id: userId || undefined,
        activity_type: activityType || undefined,
        date_from: dateFrom ? `${dateFrom}T00:00:00` : undefined,
        date_to: dateTo ? `${dateTo}T23:59:59` : undefined,
      });
      setLogs(result.logs);
      setTotal(result.meta.total);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, userId, activityType, dateFrom, dateTo, compact]);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(1);
  }, [userId, activityType, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(total / (compact ? 5 : PAGE_SIZE)));

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">User</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Activity</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All activities</option>
              {activityTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            id="activity-date-from"
            label="From date"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            id="activity-date-to"
            label="To date"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      )}

      <div className="rounded-2xl border border-wealth-border bg-wealth-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-wealth-border bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Activity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wealth-border">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-wealth-muted">
                        No activity logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{log.user_name}</p>
                          <p className="text-xs text-wealth-muted">{log.user_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={activityBadgeVariant(log.activity_type)} size="sm">
                            {formatActivityLabel(log.activity_type, activityTypes)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {log.description ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!compact && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-wealth-border px-4 py-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-wealth-muted">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
