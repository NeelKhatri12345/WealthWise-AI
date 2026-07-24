import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import {
  adminApi,
  type AdminUserDetailResponse,
  type AdminUserListItem,
} from "@/services/api/admin.api";

const PAGE_SIZE = 10;

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function userStatus(user: Pick<AdminUserListItem, "is_active" | "is_deleted">) {
  if (user.is_deleted) return { label: "Deleted", variant: "danger" as const };
  if (user.is_active) return { label: "Active", variant: "success" as const };
  return { label: "Disabled", variant: "warning" as const };
}

export default function AdminUsersPage() {
  useDocumentTitle("Manage Users");

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getUsers({
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
      });
      setUsers(result.users);
      setTotal(result.meta.total);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const openUserDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    setUserDetail(null);
    try {
      const detail = await adminApi.getUserById(userId);
      setUserDetail(detail);
    } catch {
      toast.error("Failed to load user details");
      setSelectedUserId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedUserId(null);
    setUserDetail(null);
  };

  const handleToggleStatus = async (user: AdminUserDetailResponse | AdminUserListItem) => {
    if (user.is_deleted) {
      toast.error("Deleted users cannot be modified");
      return;
    }
    if (user.role_name === "admin") {
      toast.error("Admin accounts cannot be modified");
      return;
    }
    if (!confirm(`${user.is_active ? "Disable" : "Enable"} ${user.full_name}?`)) return;

    setActionLoading(true);
    try {
      await adminApi.toggleUserStatus(user.id);
      toast.success(`User ${user.is_active ? "disabled" : "enabled"}`);
      await loadUsers();
      if (selectedUserId === user.id) {
        const detail = await adminApi.getUserById(user.id);
        setUserDetail(detail);
      }
    } catch {
      toast.error("Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSoftDelete = async (user: AdminUserDetailResponse | AdminUserListItem) => {
    if (user.is_deleted) return;
    if (user.role_name === "admin") {
      toast.error("Admin accounts cannot be deleted");
      return;
    }
    if (!confirm(`Soft delete ${user.full_name}? Their data will be retained but the account will be deactivated.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await adminApi.softDeleteUser(user.id);
      toast.success("User soft deleted");
      closeDetail();
      await loadUsers();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="User Management"
        description="Search, review, and manage registered users"
      />

      <Card padding="md" className="border-wealth-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 max-w-md">
            <Input
              id="user-search"
              label="Search users"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-sm text-wealth-muted">
            {total.toLocaleString()} user{total === 1 ? "" : "s"} found
          </p>
        </div>
      </Card>

      <div className="rounded-2xl border border-wealth-border bg-wealth-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-wealth-border bg-gray-50/80">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Last Login
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wealth-border">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-wealth-muted">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const status = userStatus(user);
                      return (
                        <tr
                          key={user.id}
                          onClick={() => void openUserDetail(user.id)}
                          className="cursor-pointer transition-colors hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">{user.full_name}</td>
                          <td className="px-6 py-4 text-gray-600">{user.email}</td>
                          <td className="px-6 py-4">
                            <Badge variant="info" size="sm">
                              {user.role_name}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={status.variant} size="sm">
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{formatDate(user.created_at)}</td>
                          <td className="px-6 py-4 text-gray-500">
                            {formatDateTime(user.last_login_at)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-wealth-border px-6 py-3">
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

      <Modal
        isOpen={selectedUserId !== null}
        onClose={closeDetail}
        title="User Details"
        size="xl"
        className="max-h-[90vh] overflow-y-auto"
      >
        {detailLoading || !userDetail ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
                {userDetail.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-900">{userDetail.full_name}</h3>
                <p className="text-sm text-wealth-muted">{userDetail.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="info" size="sm">{userDetail.role_name}</Badge>
                  <Badge variant={userStatus(userDetail).variant} size="sm">
                    {userStatus(userDetail).label}
                  </Badge>
                  {userDetail.is_verified && (
                    <Badge variant="success" size="sm">Verified</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Joined", value: formatDate(userDetail.created_at) },
                { label: "Last Login", value: formatDateTime(userDetail.last_login_at) },
                { label: "Health Score", value: userDetail.health_score != null ? `${userDetail.health_score}/100` : "—" },
                { label: "Risk Profile", value: userDetail.risk_profile ?? "—" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900 capitalize">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Statements", value: userDetail.statements_count },
                { label: "AI Chats", value: userDetail.ai_chats_count },
                { label: "Investment Plans", value: userDetail.investment_plans_count },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-primary-100 bg-primary-50/40 p-3 text-center">
                  <p className="text-2xl font-bold text-primary-700">{item.value}</p>
                  <p className="text-xs text-primary-600">{item.label}</p>
                </div>
              ))}
            </div>

            {userDetail.profile && (
              <div className="rounded-xl border border-wealth-border p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Financial Profile</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-wealth-muted">Completion</p>
                    <p className="font-medium text-gray-900">
                      {userDetail.profile.profile_completion_percentage?.toFixed(0) ?? 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-wealth-muted">Monthly Income</p>
                    <p className="font-medium text-gray-900">
                      {userDetail.profile.monthly_income != null
                        ? `₹${Number(userDetail.profile.monthly_income).toLocaleString("en-IN")}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-wealth-muted">Risk Comfort</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {userDetail.profile.risk_comfort ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-wealth-muted">Employment</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {userDetail.profile.employment_type?.replace("_", " ") ?? "—"}
                    </p>
                  </div>
                </div>
                {userDetail.profile.financial_goals && userDetail.profile.financial_goals.length > 0 && (
                  <div>
                    <p className="text-xs text-wealth-muted mb-1">Goals</p>
                    <div className="flex flex-wrap gap-1.5">
                      {userDetail.profile.financial_goals.map((goal) => (
                        <span
                          key={goal}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 capitalize"
                        >
                          {goal.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {userDetail.statements.length > 0 && (
              <div className="rounded-xl border border-wealth-border p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Uploaded Statements</h4>
                <div className="space-y-2">
                  {userDetail.statements.map((stmt) => (
                    <div
                      key={stmt.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span className="truncate font-medium text-gray-800">{stmt.file_name}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <Badge
                          variant={
                            stmt.status.toLowerCase() === "completed"
                              ? "success"
                              : stmt.status.toLowerCase() === "failed"
                                ? "danger"
                                : "warning"
                          }
                          size="sm"
                        >
                          {stmt.status}
                        </Badge>
                        <span className="text-xs text-wealth-muted">{formatDate(stmt.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!userDetail.is_deleted && userDetail.role_name !== "admin" && (
              <div className="flex flex-wrap gap-2 border-t border-wealth-border pt-4">
                <Button
                  variant={userDetail.is_active ? "secondary" : "primary"}
                  size="sm"
                  isLoading={actionLoading}
                  onClick={() => void handleToggleStatus(userDetail)}
                >
                  {userDetail.is_active ? "Disable Account" : "Enable Account"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={actionLoading}
                  onClick={() => void handleSoftDelete(userDetail)}
                >
                  Soft Delete
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
