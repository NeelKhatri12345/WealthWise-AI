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
export declare const adminApi: {
  getAdminStats(): Promise<AdminStatsResponse>;
  getUsers(): Promise<AdminUserResponse[]>;
  getUserById(id: string): Promise<AdminUserResponse>;
  updateUser(
    id: string,
    payload: UpdateUserRequest,
  ): Promise<AdminUserResponse>;
  getAuditLogs(): Promise<AuditLogResponse[]>;
  getSystemHealth(): Promise<SystemHealthResponse>;
};
