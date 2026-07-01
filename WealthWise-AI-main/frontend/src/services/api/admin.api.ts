import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface AdminStatsResponse {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  storageUsed: number;
  cpuUsage: number;
  memoryUsage: number;
  apiRequestsToday: number;
  errorRate: number;
}

export interface AdminUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  lastLogin: string;
}

export interface AuditLogResponse {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface SystemHealthResponse {
  cpu: number[];
  memory: number[];
  requests: number[];
  errors: number[];
  timestamps: string[];
}

export interface UpdateUserRequest {
  role?: "user" | "admin";
  status?: "active" | "inactive" | "suspended";
}

export const adminApi = {
  async getAdminStats(): Promise<AdminStatsResponse> {
    const { data } =
      await axiosInstance.get<ApiResponse<AdminStatsResponse>>("/admin/stats");
    return data.data;
  },

  async getUsers(): Promise<AdminUserResponse[]> {
    const { data } =
      await axiosInstance.get<ApiResponse<AdminUserResponse[]>>("/admin/users");
    return data.data;
  },

  async getUserById(id: string): Promise<AdminUserResponse> {
    const { data } = await axiosInstance.get<ApiResponse<AdminUserResponse>>(
      `/admin/users/${id}`,
    );
    return data.data;
  },

  async updateUser(
    id: string,
    payload: UpdateUserRequest,
  ): Promise<AdminUserResponse> {
    const { data } = await axiosInstance.patch<ApiResponse<AdminUserResponse>>(
      `/admin/users/${id}`,
      payload,
    );
    return data.data;
  },

  async getAuditLogs(): Promise<AuditLogResponse[]> {
    const { data } =
      await axiosInstance.get<ApiResponse<AuditLogResponse[]>>(
        "/admin/audit-logs",
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
