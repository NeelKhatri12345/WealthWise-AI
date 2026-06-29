export interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    storageUsed: number;
    cpuUsage: number;
    memoryUsage: number;
    apiRequestsToday: number;
    errorRate: number;
}
export interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'admin';
    status: 'active' | 'inactive' | 'suspended';
    createdAt: string;
    lastLogin: string;
}
export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    resource: string;
    details: string;
    ipAddress: string;
    timestamp: string;
}
export interface MonitoringData {
    cpu: number[];
    memory: number[];
    requests: number[];
    errors: number[];
    timestamps: string[];
}
export interface AdminState {
    systemStats: SystemStats | null;
    users: AdminUser[];
    auditLogs: AuditLog[];
    monitoring: MonitoringData | null;
    loading: boolean;
    error: string | null;
}
export declare const fetchAdminDashboard: import("@reduxjs/toolkit").AsyncThunk<{
    stats: import("../../services/api/admin.api").AdminStatsResponse;
    monitoring: import("../../services/api/admin.api").SystemHealthResponse;
}, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const fetchUsers: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/admin.api").AdminUserResponse[], void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const fetchAuditLogs: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/admin.api").AuditLogResponse[], void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const clearAdminError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"admin/clearAdminError">;
declare const _default: import("redux").Reducer<AdminState>;
export default _default;
