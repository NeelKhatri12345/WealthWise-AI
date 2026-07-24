import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface AdminStatsResponse {
  total_users: number;
  active_users: number;
  total_statements: number;
  total_ai_chats: number;
  total_investment_plans: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_deleted: boolean;
  role_name: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface AdminUserProfileSummary {
  profile_completion_percentage: number | null;
  monthly_income: number | null;
  risk_comfort: string | null;
  employment_type: string | null;
  financial_goals: string[] | null;
}

export interface AdminUserStatementItem {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
}

export interface AdminUserDetailResponse {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_deleted: boolean;
  role_name: string;
  created_at: string;
  last_login_at: string | null;
  health_score: number | null;
  health_band: string | null;
  risk_profile: string | null;
  statements_count: number;
  ai_chats_count: number;
  investment_plans_count: number;
  profile: AdminUserProfileSummary | null;
  statements: AdminUserStatementItem[];
}

export interface AdminUsersListMeta {
  total: number;
  skip: number;
  limit: number;
}

export interface AdminUsersListResult {
  users: AdminUserListItem[];
  meta: AdminUsersListMeta;
}

export interface ActivityLogItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  activity_type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityTypeOption {
  value: string;
  label: string;
}

export interface ActivityLogsListMeta {
  total: number;
  skip: number;
  limit: number;
}

export interface ActivityLogsListResult {
  logs: ActivityLogItem[];
  meta: ActivityLogsListMeta;
}

export interface AdminAuditLogItem {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  action: string;
  target_user_id: string | null;
  target_user_name: string | null;
  target_user_email: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminAuditActionOption {
  value: string;
  label: string;
}

export interface AdminAuditLogsListMeta {
  total: number;
  skip: number;
  limit: number;
}

export interface AdminAuditLogsListResult {
  logs: AdminAuditLogItem[];
  meta: AdminAuditLogsListMeta;
}

export interface SystemHealthResponse {
  cpu: number[];
  memory: number[];
  requests: number[];
  errors: number[];
  timestamps: string[];
}

export interface ServiceMonitorItem {
  name: string;
  label: string;
  status: "online" | "offline";
  latency_ms: number | null;
  message: string | null;
}

export interface SystemMonitoringResponse {
  checked_at: string;
  services: ServiceMonitorItem[];
}

export interface AnalyticsMetricPoint {
  date: string;
  value: number;
}

export interface RiskProfileDistributionItem {
  label: string;
  value: number;
}

export interface AdminAnalyticsResponse {
  daily_active_users: number;
  total_ai_requests: number;
  total_statements_uploaded: number;
  average_health_score: number | null;
  average_risk_profile: string | null;
  daily_active_users_trend: AnalyticsMetricPoint[];
  ai_requests_trend: AnalyticsMetricPoint[];
  statements_trend: AnalyticsMetricPoint[];
  health_score_trend: AnalyticsMetricPoint[];
  risk_profile_distribution: RiskProfileDistributionItem[];
}

export const adminApi = {
  async getAdminStats(): Promise<AdminStatsResponse> {
    const { data } =
      await axiosInstance.get<ApiResponse<AdminStatsResponse>>("/admin/stats");
    return data.data;
  },

  async getAdminAnalytics(days = 7): Promise<AdminAnalyticsResponse> {
    const { data } = await axiosInstance.get<ApiResponse<AdminAnalyticsResponse>>(
      "/admin/analytics",
      { params: { days } },
    );
    return data.data;
  },

  async getUsers(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    include_deleted?: boolean;
  }): Promise<AdminUsersListResult> {
    const { data } = await axiosInstance.get<ApiResponse<AdminUserListItem[]>>(
      "/admin/users",
      { params },
    );
    return {
      users: data.data ?? [],
      meta: (data.meta as AdminUsersListMeta) ?? {
        total: data.data?.length ?? 0,
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 20,
      },
    };
  },

  async getUserById(id: string): Promise<AdminUserDetailResponse> {
    const { data } = await axiosInstance.get<ApiResponse<AdminUserDetailResponse>>(
      `/admin/users/${id}`,
    );
    return data.data;
  },

  async toggleUserStatus(id: string): Promise<AdminUserListItem> {
    const { data } = await axiosInstance.patch<ApiResponse<AdminUserListItem>>(
      `/admin/users/${id}/status`,
    );
    return data.data;
  },

  async softDeleteUser(id: string): Promise<AdminUserListItem> {
    const { data } = await axiosInstance.delete<ApiResponse<AdminUserListItem>>(
      `/admin/users/${id}`,
    );
    return data.data;
  },

  async getActivityLogs(params?: {
    skip?: number;
    limit?: number;
    user_id?: string;
    activity_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ActivityLogsListResult> {
    const { data } = await axiosInstance.get<ApiResponse<ActivityLogItem[]>>(
      "/admin/activity-logs",
      { params },
    );
    return {
      logs: data.data ?? [],
      meta: (data.meta as ActivityLogsListMeta) ?? {
        total: data.data?.length ?? 0,
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 20,
      },
    };
  },

  async getActivityTypes(): Promise<ActivityTypeOption[]> {
    const { data } = await axiosInstance.get<ApiResponse<ActivityTypeOption[]>>(
      "/admin/activity-logs/types",
    );
    return data.data ?? [];
  },

  async getAuditLogs(params?: {
    skip?: number;
    limit?: number;
    admin_id?: string;
    action?: string;
    target_user_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<AdminAuditLogsListResult> {
    const { data } = await axiosInstance.get<ApiResponse<AdminAuditLogItem[]>>(
      "/admin/audit-logs",
      { params },
    );
    return {
      logs: data.data ?? [],
      meta: (data.meta as AdminAuditLogsListMeta) ?? {
        total: data.data?.length ?? 0,
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 20,
      },
    };
  },

  async getAuditActions(): Promise<AdminAuditActionOption[]> {
    const { data } = await axiosInstance.get<ApiResponse<AdminAuditActionOption[]>>(
      "/admin/audit-logs/actions",
    );
    return data.data ?? [];
  },

  async getSystemMonitoring(): Promise<SystemMonitoringResponse> {
    const { data } = await axiosInstance.get<ApiResponse<SystemMonitoringResponse>>(
      "/admin/system-monitoring",
    );
    return data.data;
  },

  async getSystemHealth(): Promise<SystemHealthResponse> {
    const { data } = await axiosInstance.get<ApiResponse<SystemHealthResponse>>(
      "/admin/system-health",
    );
    return data.data;
  },
};
