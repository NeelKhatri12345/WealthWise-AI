import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  adminApi,
  type AdminAuditActionOption,
  type AdminAuditLogItem,
} from "@/services/api/admin.api";

const PAGE_SIZE = 15;

const actionBadgeVariant = (action: string) => {
  switch (action) {
    case "admin_login":
      return "info" as const;
    case "viewed_user":
      return "default" as const;
    case "disabled_user":
      return "warning" as const;
    case "enabled_user":
      return "success" as const;
    case "deleted_user":
      return "danger" as const;
    default:
      return "default" as const;
  }
};

function formatActionLabel(action: string, actions: AdminAuditActionOption[]): string {
  return actions.find((a) => a.value === action)?.label ?? action.replace(/_/g, " ");
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

export function AdminAuditTable() {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [actions, setActions] = useState<AdminAuditActionOption[]>([]);
  const [admins, setAdmins] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [adminId, setAdminId] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadFilters = useCallback(async () => {
    try {
      const [actionOptions, userResult] = await Promise.all([
        adminApi.getAuditActions(),
        adminApi.getUsers({ limit: 100 }),
      ]);
      setActions(actionOptions);
      setAdmins(
        userResult.users.filter((u) => u.role_name === "admin" && !u.is_deleted),
      );
    } catch {
      // Filters are optional
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getAuditLogs({
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        admin_id: adminId || undefined,
        action: action || undefined,
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
  }, [page, adminId, action, dateFrom, dateTo]);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(1);
  }, [adminId, action, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Administrator</label>
          <select
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All admins</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name} ({a.email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          id="audit-date-from"
          label="From date"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          id="audit-date-to"
          label="To date"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

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
                      Administrator
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Target User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wealth-border">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-wealth-muted">
                        No audit logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{log.admin_name}</p>
                          <p className="text-xs text-wealth-muted">{log.admin_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={actionBadgeVariant(log.action)} size="sm">
                            {formatActionLabel(log.action, actions)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {log.target_user_name ? (
                            <>
                              <p className="font-medium text-gray-900">{log.target_user_name}</p>
                              <p className="text-xs text-wealth-muted">
                                {log.target_user_email}
                              </p>
                            </>
                          ) : (
                            <span className="text-wealth-muted">—</span>
                          )}
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

            {totalPages > 1 && (
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
